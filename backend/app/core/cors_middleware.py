import re
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from app.core.config import settings

ALLOW_HEADERS = "Content-Type, Authorization, Origin, Accept, X-Requested-With"


class RegexCORSMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
        self.allow_origins = settings.CORS_ORIGINS
        self.allow_origin_regex = re.compile(r"https://.*\.vercel\.app")

    def origin_allowed(self, origin: str) -> bool:
        if origin in self.allow_origins:
            return True
        if self.allow_origin_regex and self.allow_origin_regex.search(origin):
            return True
        return False

    def cors_headers(self, origin: str) -> dict:
        if not origin or not self.origin_allowed(origin):
            return {}
        return {
            "access-control-allow-origin": origin,
            "access-control-allow-credentials": "true",
            "access-control-allow-methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "access-control-allow-headers": ALLOW_HEADERS,
            "access-control-max-age": "86400",
            "vary": "Origin",
        }

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        origin = headers.get("origin", "")
        method = scope.get("method", "GET")

        if method == "OPTIONS":
            ch = self.cors_headers(origin)
            h = [(k.encode(), v.encode()) for k, v in ch.items()]
            await send({"type": "http.response.start", "status": 204, "headers": h})
            await send({"type": "http.response.body", "body": b""})
            return

        async def send_with_cors(msg: Message) -> None:
            if msg["type"] == "http.response.start":
                for k, v in self.cors_headers(origin).items():
                    MutableHeaders(scope=msg).append(k, v)
            await send(msg)

        await self.app(scope, receive, send_with_cors)
