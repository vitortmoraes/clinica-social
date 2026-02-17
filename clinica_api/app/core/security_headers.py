from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # 1. HSTS (Force HTTPS) - 1 Year
        # Railway handles SSL termination, but this tells the browser to always use HTTPS
        response.headers[
            "Strict-Transport-Security"
        ] = "max-age=31536000; includeSubDomains"

        # 2. Anti-Clickjacking (Prevent site from being embedded in iFrame)
        response.headers["X-Frame-Options"] = "DENY"

        # 3. Anti-MIME-Sniffing (Force browser to trust Content-Type)
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 4. XSS Protection (Legacy but useful defense-in-depth)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 5. Referrer Policy (Privacy)
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Content Security Policy (Basic)
        # Allows scripts only from self (prevents obscure external script injection)
        # Note: Might need adjustment if using CDNs later.
        # response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"

        return response
