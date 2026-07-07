from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.dependencies import get_current_user
from app.models.user import User
from app.models.chat import Chat, Message, AgentType
from app.agents.crew import get_agent, list_agents
from app.core.exceptions import ExternalServiceError

router = APIRouter(prefix="/agents", tags=["AI Agents"])


class ChatRequest(BaseModel):
    message: str
    agent_type: AgentType
    chat_id: int | None = None


class ChatResponse(BaseModel):
    chat_id: int
    response: str
    agent_type: str
    agent_name: str


@router.get("/list")
async def get_agents():
    return {"agents": list_agents()}


@router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = get_agent(request.agent_type)

    if request.chat_id:
        result = await db.execute(
            select(Chat).where(Chat.id == request.chat_id, Chat.user_id == current_user.id)
        )
        chat = result.scalar_one_or_none()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
    else:
        chat = Chat(
            user_id=current_user.id,
            title=request.message[:50],
            agent_type=request.agent_type,
        )
        db.add(chat)
        await db.flush()

    user_msg = Message(
        chat_id=chat.id,
        content=request.message,
        role="user",
    )
    db.add(user_msg)

    history = await db.execute(
        select(Message).where(Message.chat_id == chat.id).order_by(Message.created_at)
    )
    messages = history.scalars().all()

    ollama_messages = []
    for m in messages[-10:]:
        role = "user" if m.role == "user" else "assistant"
        ollama_messages.append({"role": role, "content": m.content})

    ollama_messages.insert(0, {"role": "system", "content": agent.system_prompt})

    try:
        response_text = agent.chat(ollama_messages)
    except ConnectionError:
        raise ExternalServiceError(
            "Cannot connect to Ollama. Make sure Ollama is running locally (ollama serve). "
            "See https://ollama.com/download"
        )
    except Exception as e:
        err_msg = str(e)
        if "image input" in err_msg.lower() or "clipboard" in err_msg.lower():
            raise ExternalServiceError(
                f"The model '{settings.OLLAMA_MODEL}' doesn't support this request format. "
                f"Try a different model like 'llama3.2' or 'mistral'."
            )
        if "401" in err_msg or "unauthorized" in err_msg.lower() or "invalid api key" in err_msg.lower():
            raise ExternalServiceError(
                "AI service unavailable: Invalid or missing Groq API key. "
                "Set a valid GROQ_API_KEY in the Render dashboard environment variables."
            )
        provider = settings.LLM_PROVIDER
        raise ExternalServiceError(f"{provider.capitalize()} error: {err_msg}")

    assistant_msg = Message(
        chat_id=chat.id,
        content=response_text,
        role="assistant",
    )
    db.add(assistant_msg)

    await db.flush()
    chat.updated_at = datetime.utcnow()

    return ChatResponse(
        chat_id=chat.id,
        response=response_text,
        agent_type=request.agent_type.value,
        agent_name=agent.name,
    )


@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat).where(Chat.user_id == current_user.id).order_by(Chat.updated_at.desc())
    )
    chats = result.scalars().all()
    return {"chats": [{"id": c.id, "title": c.title, "agent_type": c.agent_type.value, "created_at": c.created_at} for c in chats]}


@router.get("/history/{chat_id}")
async def get_chat_messages(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message).join(Chat).where(Chat.id == chat_id, Chat.user_id == current_user.id).order_by(Message.created_at)
    )
    messages = result.scalars().all()
    return {"messages": [{"role": m.role, "content": m.content, "created_at": m.created_at} for m in messages]}