import re
from starlette.datastructures import Headers, MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from app.core.config import settings


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

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        origin = headers.get("origin", "")
        method = scope.get("method", "GET")

        if method == "OPTIONS":
            res_headers = {}
            if origin and self.origin_allowed(origin):
                res_headers["access-control-allow-origin"] = origin
                res_headers["access-control-allow-credentials"] = "true"
                res_headers["access-control-allow-methods"] = "*"
                res_headers["access-control-allow-headers"] = "*"
                res_headers["access-control-max-age"] = "86400"
            response_sent = False

            async def send_preflight(msg: Message) -> None:
                nonlocal response_sent
                if msg["type"] == "http.response.start":
                    response_sent = True
                    msg["status"] = 204
                    for k, v in res_headers.items():
                        msg["headers"].append((k.encode(), v.encode()))
                await send(msg)

            if not response_sent:
                await send({
                    "type": "http.response.start",
                    "status": 204,
                    "headers": [(k.encode(), v.encode()) for k, v in res_headers.items()],
                })
                await send({"type": "http.response.body", "body": b""})
            return

        async def send_with_cors(msg: Message) -> None:
            if msg["type"] == "http.response.start":
                if origin and self.origin_allowed(origin):
                    mutable = MutableHeaders(scope=msg)
                    mutable.append("access-control-allow-origin", origin)
                    mutable.append("access-control-allow-credentials", "true")
                    mutable.append("access-control-allow-methods", "*")
                    mutable.append("access-control-allow-headers", "*")
            await send(msg)

        await self.app(scope, receive, send_with_cors)
