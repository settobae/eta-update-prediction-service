import logging
import os


def configure_logging() -> None:
    """
    컨테이너 stdout으로 흘러가는 애플리케이션 로그 포맷/레벨을 설정합니다.
    `docker compose logs vessel-analyzer`에서 요청 수신부터 Codex CLI 왕복,
    BE로의 응답 반환까지 시간순으로 추적할 수 있도록 타임스탬프를 포함합니다.
    """
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
