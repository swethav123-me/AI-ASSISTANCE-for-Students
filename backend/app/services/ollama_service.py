import ollama
from groq import Groq
from groq import APIError as GroqAPIError
from app.core.config import settings


class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.ollama_client = ollama.Client(host=settings.OLLAMA_BASE_URL)
        groq_key = settings.GROQ_API_KEY.strip().strip("'\"") if settings.GROQ_API_KEY else ""
        self.groq_client = Groq(api_key=groq_key) if groq_key else None

    def chat(self, messages: list[dict]) -> str:
        if self.provider == "groq" and self.groq_client:
            return self._groq_chat(messages)
        return self._ollama_chat(messages)

    def _ollama_chat(self, messages: list[dict]) -> str:
        response = self.ollama_client.chat(
            model=settings.OLLAMA_MODEL,
            messages=messages,
            options={
                "temperature": settings.OLLAMA_TEMPERATURE,
                "num_predict": settings.OLLAMA_MAX_TOKENS,
            },
        )
        return response.get("message", {}).get("content", "")

    def _groq_chat(self, messages: list[dict]) -> str:
        try:
            response = self.groq_client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=messages,
                temperature=settings.OLLAMA_TEMPERATURE,
                max_tokens=settings.OLLAMA_MAX_TOKENS,
            )
            return response.choices[0].message.content or ""
        except GroqAPIError as e:
            raise RuntimeError(f"Groq API error (status {e.status_code}): {e.message}")


llm_service = LLMService()
