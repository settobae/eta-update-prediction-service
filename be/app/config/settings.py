import os
from dotenv import load_dotenv, find_dotenv

# 로컬 직접 실행 시 .env 로드 (Docker에서는 compose가 env 주입)
load_dotenv(find_dotenv(usecwd=True))

APP_NAME    = os.getenv("APP_NAME", "Cargo Tracker API")
APP_VERSION = os.getenv("APP_VERSION", "0.1.0")
DEBUG       = os.getenv("DEBUG", "false").lower() == "true"

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB  = os.getenv("MONGODB_DB", "")

# comma-separated: http://localhost:5173,https://example.com
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

AI_API_BASE_URL = os.getenv("AI_API_BASE_URL", "")
# AI 서버가 좌표 추론 + Codex 실행자/검수자 파이프라인을 순차 호출하므로 수분이 걸릴 수 있음
AI_API_TIMEOUT_SECONDS = float(os.getenv("AI_API_TIMEOUT_SECONDS", "300"))
