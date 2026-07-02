from app.dto.cargo_dto import CargoResponse
from app.dto.ai_dto import AISummaryResponse

cargo_tags_metadata = [
    {
        "name": "Cargo",
        "description": "화물 관련 API 엔드포인트입니다.",
    }
]

create_docs = dict(
    response_model=CargoResponse,
    status_code=201,
    summary="화물 등록",
    description="새 화물을 등록합니다. add_at, updated_at은 자동 설정됩니다.",
)

get_all_docs = dict(
    response_model=list[CargoResponse],
    summary="전체 화물 목록 조회",
    description="ETA 임박 순 정렬 / ETA가 지난 항목은 최근 수정 순",
)

update_docs = dict(
    response_model=CargoResponse,
    summary="화물 수정",
    description="모든 필드를 전송해 덮어씁니다. 수정된 cargo를 반환합니다.",
)

delete_docs = dict(
    summary="화물 삭제",
)

summary_docs = dict(
    response_model=AISummaryResponse,
    summary="AI 화물 경로 요약 조회",
    description="화물 출발/경유/도착 정보를 AI 서버로 전달해 경로 좌표 및 요약을 받아 그대로 반환합니다. 응답은 MongoDB에 별도 저장됩니다.",
)
