import httpx
import hmac
import hashlib
from decimal import Decimal
from typing import Optional, Dict, Any
from app.core.config import settings

class ChapaService:
    """Service for integrating with Chapa payment gateway"""
    
    def __init__(self):
        self.base_url = "https://api.chapa.co/v1"
        self.secret_key = getattr(settings, 'CHAPA_SECRET_KEY', '')
        self.public_key = getattr(settings, 'CHAPA_PUBLIC_KEY', '')
        self.webhook_secret = getattr(settings, 'CHAPA_WEBHOOK_SECRET', '')
    
    async def initialize_payment(
        self,
        amount: Decimal,
        email: str,
        first_name: str,
        last_name: str,
        tx_ref: str,
        callback_url: str,
        return_url: str,
        currency: str = "ETB",
        customization: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Initialize a payment with Chapa
        
        Args:
            amount: Payment amount
            email: Customer email
            first_name: Customer first name
            last_name: Customer last name
            tx_ref: Unique transaction reference
            callback_url: Webhook callback URL
            return_url: URL to redirect after payment
            currency: Currency code (default: ETB)
            customization: Optional customization dict with title, description, logo
            
        Returns:
            Dict containing checkout_url and other payment details
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "amount": str(amount),
            "currency": currency,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "tx_ref": tx_ref,
            "callback_url": callback_url,
            "return_url": return_url,
        }
        
        if customization:
            payload["customization"] = customization
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/transaction/initialize",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def verify_payment(self, tx_ref: str) -> Dict[str, Any]:
        """
        Verify a payment transaction with Chapa
        
        Args:
            tx_ref: Transaction reference to verify
            
        Returns:
            Dict containing payment status and details
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/transaction/verify/{tx_ref}",
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    async def process_refund(
        self,
        transaction_id: str,
        amount: Decimal,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process a refund for a transaction
        
        Args:
            transaction_id: Chapa transaction ID
            amount: Amount to refund
            reason: Optional refund reason
            
        Returns:
            Dict containing refund status and details
        """
        headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "transaction_id": transaction_id,
            "amount": str(amount)
        }
        
        if reason:
            payload["reason"] = reason
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/transaction/refund",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Chapa webhook signature using HMAC-SHA256
        
        Args:
            payload: Raw webhook payload bytes
            signature: Signature from webhook header
            
        Returns:
            True if signature is valid, False otherwise
        """
        if not self.webhook_secret:
            return False
        
        # Calculate expected signature
        expected_signature = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (constant time comparison)
        return hmac.compare_digest(expected_signature, signature)


# Singleton instance
chapa_service = ChapaService()
