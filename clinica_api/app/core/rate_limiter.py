from fastapi import Request, Response
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

# Create the limiter instance
# key_func: How to identify the user (by IP address)
# default_limits: Global limit for all endpoints (100 per minute)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


# Custom Error Handler for Rate Limit Exceeded
def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Returns a JSON response when the rate limit is exceeded.
    """
    response = JSONResponse(
        {"error": f"Muitas requisições. Tente novamente em alguns segundos."},
        status_code=429,
    )
    return response
