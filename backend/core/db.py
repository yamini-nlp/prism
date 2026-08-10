import re
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import settings
from core.models import Base, Session as SessionModel

DATABASE_URL = settings.database_url

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

_SESSION_ID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def validate_session_id(session_id: str) -> str:
    if not session_id or not _SESSION_ID_RE.match(session_id):
        raise ValueError("Invalid session_id")
    return session_id


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)


async def ensure_session(db: AsyncSession, session_id: str) -> None:
    validate_session_id(session_id)
    stmt = pg_insert(SessionModel).values(id=session_id).on_conflict_do_nothing(index_elements=["id"])
    await db.execute(stmt)
    await db.commit()
    