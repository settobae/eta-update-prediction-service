import httpx
from app.config.settings import AI_API_BASE_URL, AI_API_TIMEOUT_SECONDS
from app.dto.ai_dto import AISummaryRequest, AISummaryResponse


class AIClient:
    def __init__(self, base_url: str = AI_API_BASE_URL, timeout: float = AI_API_TIMEOUT_SECONDS):
        self._base_url = base_url
        self._timeout = timeout

    async def request_summary(self, dto: AISummaryRequest) -> AISummaryResponse:
        async with httpx.AsyncClient(base_url=self._base_url, timeout=self._timeout) as client:
            response = await client.post(
                "/api/analyze-route",
                json=dto.model_dump(by_alias=True, mode="json"),
            )
            response.raise_for_status()
            return AISummaryResponse(**response.json())


ai_client = AIClient()
