import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.logging_config import configure_logging
from app.schemas.route import RouteRequest, RouteResponse, PathPoint, IssueItem, SummaryDetails
from app.config import config
from app.services.router import calculate_optimal_route
from app.services.analyzer import analyze_route_issues

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="선박 최적 항로 및 외부 위협 분석 API",
    description="웹 UI 요청을 받아 searoute로 해상 경로를 계산하고, Codex CLI 실행자/검수자 파이프라인으로 경로상 위험 이슈를 분석해 ETA를 보정합니다.",
    version="3.0.0"
)

# 프론트엔드 연동을 위한 CORS 개방
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ALLOW_ORIGINS,
    allow_credentials=config.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Vessel Route & Threat Analyzer Backend",
        "documentation": "/docs"
    }

@app.post("/api/analyze-route", response_model=RouteResponse)
async def analyze_route(request: RouteRequest):
    # 요청 도달 시점에는 이미 Pydantic(RouteRequest) 검증을 통과한 상태이므로,
    # 이 로그가 찍혔다는 것 자체가 BE가 던진 JSON 파싱/검증이 성공했다는 뜻입니다.
    logger.info(
        "[1/4] BE 요청 수신 및 파싱 성공 | from=%s stopover=%s to=%s atd=%s eta=%s",
        request.departure_from, request.stopover, request.to, request.atd, request.eta
    )
    try:
        # 1. 단일 경유지(stopover)를 감안한 searoute 최적 항로 계산 및 10개 대표 포인트 획득
        sampled_route, stopover_index = await calculate_optimal_route(
            departure=request.departure_from,
            destination=request.to,
            stopover=request.stopover
        )
        logger.info("[진행] 항로 계산 완료 | 대표 좌표 %d개", len(sampled_route))

        # 2. Codex CLI 실행자/검수자 파이프라인을 통한 경로상 이슈 분석 및 ETA 조정
        analysis_result = await analyze_route_issues(
            departure=request.departure_from,
            destination=request.to,
            atd=request.atd,
            eta=request.eta,
            route_points=sampled_route,
            stopover_index=stopover_index
        )
        logger.info(
            "[3/4] Codex 응답 수신 | delay_risk=%s total_delay_hours=%s issues=%d개",
            analysis_result.get("delay_risk"),
            analysis_result.get("total_delay_hours"),
            len(analysis_result.get("issues", []))
        )

        # 3. KST 기준으로 계산된 좌표별 경로 데이터(PathPoint) 매핑
        path_points_model = []
        for point in analysis_result.get("route_points", []):
            path_points_model.append(
                PathPoint(
                    lat=point.get("lat"),
                    lon=point.get("lon"),
                    arrive_at=point.get("arrive_at"),
                    point_type=point.get("point_type")
                )
            )
        
        # 4. 분석 결과에서 이슈 모델 데이터 포맷팅
        formatted_issues = []
        for issue in analysis_result.get("issues", []):
            formatted_issues.append(
                IssueItem(
                    category=issue.get("category", "기타"),
                    location=issue.get("location", "알 수 없음"),
                    severity=issue.get("severity", "Low"),
                    description=issue.get("description", "상세 내용 없음"),
                    article_link=issue.get("article_link", ""),
                    publisher=issue.get("publisher", "알 수 없음"),
                    published_at=issue.get("published_at", ""),
                    source_tier=issue.get("source_tier", "Tier 4"),
                    verification_status=issue.get("verification_status", "corrected")
                )
            )
            
        # 5. 최종 API 응답 요약 데이터(SummaryDetails) 매핑 및 반환
        summary_details = SummaryDetails(
            delay_risk=analysis_result.get("delay_risk", "낮음 (안정)"),
            total_delay_hours=analysis_result.get("total_delay_hours", 0),
            eta_adjusted=analysis_result.get("eta_adjusted", request.eta),
            issues=formatted_issues,
            analysis_summary=analysis_result.get("analysis_summary", "분석이 정상적으로 완료되었습니다.")
        )
        
        response_data = RouteResponse(
            path=path_points_model,
            summary=summary_details
        )

        logger.info(
            "[4/4] BE로 응답 반환 | path=%d개 issues=%d개 eta_adjusted=%s",
            len(response_data.path), len(response_data.summary.issues), response_data.summary.eta_adjusted
        )

        return response_data

    except Exception as e:
        logger.exception("항로 분석 처리 중 서버 내부 오류 발생 | from=%s to=%s", request.departure_from, request.to)
        raise HTTPException(
            status_code=500,
            detail=f"항로 분석 처리 중 서버 내부 오류가 발생했습니다: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
