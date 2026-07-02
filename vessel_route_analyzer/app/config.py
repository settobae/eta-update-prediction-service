import os
from dotenv import load_dotenv

# .env 파일이 존재할 경우 로드
load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
    CORS_ALLOW_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
        if origin.strip()
    ]
    CORS_ALLOW_CREDENTIALS = "*" not in CORS_ALLOW_ORIGINS
    
config = Config()
