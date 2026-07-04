import ollama
from app.core.config import settings


class OllamaService:
    def __init__(self):
        self.client = ollama.Client(host=settings.OLLAMA_BASE_URL)
        self.model = settings.OLLAMA_MODEL

    def generate(self, prompt: str, system: str = "") -> str:
        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            system=system,
            options={
                "temperature": settings.OLLAMA_TEMPERATURE,
                "num_predict": settings.OLLAMA_MAX_TOKENS,
            },
        )
        return response.get("response", "")

    def chat(self, messages: list[dict]) -> str:
        response = self.client.chat(
            model=self.model,
            messages=messages,
            options={
                "temperature": settings.OLLAMA_TEMPERATURE,
                "num_predict": settings.OLLAMA_MAX_TOKENS,
            },
        )
        return response.get("message", {}).get("content", "")


ollama_service = OllamaService()