import os

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration


def setup_telemetry():
    """
    Initializes Sentry for error tracking if SENTRY_DSN is present.
    """
    dsn = os.getenv("SENTRY_DSN")

    if dsn:
        print("[INFO] Sentry DSN found. Initializing telemetry...")
        sentry_sdk.init(
            dsn=dsn,
            integrations=[
                StarletteIntegration(),
                FastApiIntegration(),
                SqlalchemyIntegration(),
            ],
            # Set traces_sample_rate to 1.0 to capture 100%
            # of transactions for performance monitoring.
            # We recommend adjusting this value in production.
            traces_sample_rate=1.0,
            # Set profiles_sample_rate to 1.0 to profile 100%
            # of sampled transactions.
            # We recommend adjusting this value in production.
            profiles_sample_rate=1.0,
            environment=os.getenv("ENVIRONMENT", "production"),
        )
    else:
        print("[WARN] Sentry DSN not found. Telemetry disabled.")
