from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Set
from datetime import datetime
import json
import asyncio
from app.core.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.api.v1.auth import get_current_user_from_token

router = APIRouter()

# Store active WebSocket connections
# Format: {user_id: Set[WebSocket]}
active_connections: Dict[int, Set[WebSocket]] = {}


class ConnectionManager:
    """Manages WebSocket connections for real-time notifications"""
    
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and register a new WebSocket connection"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user's connections"""
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.active_connections[user_id].discard(connection)
    
    async def broadcast_to_user(self, user_id: int, notification_data: dict):
        """Broadcast notification to all connections of a user"""
        await self.send_personal_message(notification_data, user_id)


# Global connection manager instance
manager = ConnectionManager()


async def get_user_from_websocket(websocket: WebSocket, token: str, db: AsyncSession) -> User:
    """Authenticate user from WebSocket token"""
    try:
        user = await get_current_user_from_token(token, db)
        return user
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise


@router.websocket("/notifications")
async def websocket_notifications(
    websocket: WebSocket,
    token: str
):
    """
    WebSocket endpoint for real-time notifications
    
    Usage:
    - Connect: ws://localhost:8000/api/v1/ws/notifications?token=<jwt_token>
    - Receive: JSON messages with notification data
    - Send: Ping messages to keep connection alive
    
    Message format:
    {
        "type": "notification",
        "data": {
            "id": 123,
            "type": "order_status_changed",
            "title": "Order Updated",
            "message": "Your order #456 status changed to shipped",
            "created_at": "2024-01-15T10:30:00Z",
            "is_read": false
        }
    }
    """
    
    # Create database session manually for WebSocket
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        # Authenticate user
        try:
            user = await get_user_from_websocket(websocket, token, db)
        except Exception:
            return
        
        # Connect user
        await manager.connect(websocket, user.id)
        
        try:
            # Send initial connection success message
            await websocket.send_json({
                "type": "connected",
                "message": "WebSocket connection established",
                "user_id": user.id,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Send any unread notifications
            result = await db.execute(
                select(Notification)
                .where(Notification.user_id == user.id, Notification.is_read == False)
                .order_by(Notification.created_at.desc())
                .limit(10)
            )
            unread_notifications = result.scalars().all()
            
            if unread_notifications:
                await websocket.send_json({
                    "type": "unread_notifications",
                    "count": len(unread_notifications),
                    "notifications": [
                        {
                            "id": notif.id,
                            "type": notif.type,
                            "title": notif.title,
                            "message": notif.message,
                            "created_at": notif.created_at.isoformat(),
                            "is_read": notif.is_read
                        }
                        for notif in unread_notifications
                    ]
                })
            
            # Keep connection alive and handle incoming messages
            while True:
                try:
                    # Wait for messages from client (ping/pong for keep-alive)
                    data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                    
                    # Handle ping messages
                    if data == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    
                    # Handle mark as read requests
                    elif data.startswith("mark_read:"):
                        notification_id = int(data.split(":")[1])
                        result = await db.execute(
                            select(Notification).where(
                                Notification.id == notification_id,
                                Notification.user_id == user.id
                            )
                        )
                        notification = result.scalar_one_or_none()
                        if notification:
                            notification.is_read = True
                            await db.commit()
                            await websocket.send_json({
                                "type": "marked_read",
                                "notification_id": notification_id
                            })
                    
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, user.id)
        except Exception as e:
            manager.disconnect(websocket, user.id)
            try:
                await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            except:
                pass


async def notify_user_via_websocket(user_id: int, notification: Notification):
    """
    Helper function to send notification via WebSocket
    Call this from other parts of the application to push real-time notifications
    """
    notification_data = {
        "type": "notification",
        "data": {
            "id": notification.id,
            "type": notification.type,
            "title": notification.title,
            "message": notification.message,
            "created_at": notification.created_at.isoformat(),
            "is_read": notification.is_read
        }
    }
    await manager.broadcast_to_user(user_id, notification_data)
