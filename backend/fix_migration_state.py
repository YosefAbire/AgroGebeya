"""
Fix migration state when alembic version table is out of sync with actual database
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def fix_migration_state():
    """Reset alembic version to base so we can rerun migrations"""
    
    engine = create_async_engine(
        settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"),
        echo=True
    )
    
    async with engine.begin() as conn:
        print("Resetting alembic version to base...")
        # Update alembic version to the previous migration
        await conn.execute(
            text("UPDATE alembic_version SET version_num = 'a797d7abda0c'")
        )
        print("✅ Alembic version reset to a797d7abda0c")
    
    await engine.dispose()
    
    print("\nNow run:")
    print("  alembic upgrade head")
    print("  python seed_data.py")

if __name__ == "__main__":
    asyncio.run(fix_migration_state())
