from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Determine connection args based on DB type
connect_args = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    # Create engine for SQLite
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)

elif settings.DATABASE_URL.startswith("postgresql"):
    # Fix for Railway/Heroku "postgres://" vs SQLAlchemy "postgresql://"
    db_url = settings.DATABASE_URL.replace("postgres://", "postgresql://")

    # PostgreSQL connection args (SSL for Cloud)
    # Note: Only enforced if explicitly using a cloud URL, usually handled by env
    engine = create_engine(db_url, pool_pre_ping=True)

else:
    # Default fallback
    engine = create_engine(settings.DATABASE_URL)


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
