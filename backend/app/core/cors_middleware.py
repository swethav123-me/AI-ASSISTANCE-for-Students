import re
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

    def cors_headers(self, origin: str) -> list[tuple[bytes, bytes]]:
        if not origin:
            return []
        if not self.origin_allowed(origin):
            return []
        return [
            (b"access-control-allow-origin", origin.encode()),
            (b"access-control-allow-credentials", b"true"),
            (b"access-control-allow-methods", b"GET, POST, PUT, DELETE, PATCH, OPTIONS"),
            (b"access-control-allow-headers", ALLOW_HEADERS.encode()),
            (b"access-control-max-age", b"86400"),
            (b"vary", b"Origin"),
        ]

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        origin = ""
        for k, v in scope.get("headers", []):
            if k == b"origin":
                origin = v.decode()
                break

        method = scope.get("method", "GET")

        if method == "OPTIONS":
            ch = self.cors_headers(origin)
            await send({"type": "http.response.start", "status": 204, "headers": ch})
            await send({"type": "http.response.body", "body": b""})
            return

        cors_h = self.cors_headers(origin)

        async def send_with_cors(msg: Message) -> None:
            if msg["type"] == "http.response.start":
                for kv in cors_h:
                    msg["headers"].append(kv)
            await send(msg)

        await self.app(scope, receive, send_with_cors)
