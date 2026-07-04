from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date
from pydantic import BaseModel

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.chat import Chat, Message
from app.models.document import Document

router = APIRouter(prefix="/analytics", tags=["Analytics"])


class AgentTypeStat(BaseModel):
    agent_type: str
    count: int


class DailyActivity(BaseModel):
    date: str
    messages: int


class AnalyticsResponse(BaseModel):
    total_chats: int
    total_messages: int
    total_documents: int
    per_agent: list[AgentTypeStat]
    daily_activity: list[DailyActivity]


@router.get("/stats", response_model=AnalyticsResponse)
async def get_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    chat_count = await db.scalar(
        select(func.count(Chat.id)).where(Chat.user_id == current_user.id)
    )

    msg_count = await db.scalar(
        select(func.count(Message.id)).join(Chat).where(Chat.user_id == current_user.id)
    )

    doc_count = await db.scalar(
        select(func.count(Document.id)).where(Document.user_id == current_user.id)
    )

    agent_rows = await db.execute(
        select(Chat.agent_type, func.count(Chat.id).label("count"))
        .where(Chat.user_id == current_user.id)
        .group_by(Chat.agent_type)
    )
    per_agent = [AgentTypeStat(agent_type=str(row[0]), count=row[1]) for row in agent_rows]

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_rows = await db.execute(
        select(
            cast(Message.created_at, Date).label("day"),
            func.count(Message.id).label("count"),
        )
        .join(Chat)
        .where(Chat.user_id == current_user.id, Message.created_at >= seven_days_ago)
        .group_by(cast(Message.created_at, Date))
        .order_by("day")
    )
    daily_activity = [DailyActivity(date=str(row[0]), messages=row[1]) for row in daily_rows]

    return AnalyticsResponse(
        total_chats=chat_count or 0,
        total_messages=msg_count or 0,
        total_documents=doc_count or 0,
        per_agent=per_agent,
        daily_activity=daily_activity,
    )
