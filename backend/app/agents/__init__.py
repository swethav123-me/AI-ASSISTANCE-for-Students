from app.services.ollama_service import ollama_service


class BaseAgent:
    def __init__(self, name: str, role: str, goal: str, backstory: str, system_prompt: str):
        self.name = name
        self.role = role
        self.goal = goal
        self.backstory = backstory
        self.system_prompt = system_prompt

    def run(self, prompt: str) -> str:
        return ollama_service.generate(prompt, system=self.system_prompt)

    def chat(self, messages: list[dict]) -> str:
        return ollama_service.chat(messages)