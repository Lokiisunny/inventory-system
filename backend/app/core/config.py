import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE_URL fallback to local sqlite if not specified for easy local development
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./inventory.db"
    )
    
    # CORS Origins (comma separated list in env)
    CORS_ORIGINS: list[str] = [
        origin.strip() 
        for origin in os.getenv("CORS_ORIGINS", "*").split(",")
        if origin.strip()
    ]

settings = Settings()
