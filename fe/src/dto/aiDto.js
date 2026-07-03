// be/app/dto/ai_dto.py의 AISummaryResponse에 대응
export const EMPTY_AI_SUMMARY = {
  path: [],
  summary: {
    delay_risk: '',
    total_delay_hours: 0,
    eta_adjusted: '',
    issues: [],
    analysis_summary: '',
  },
}

const toIssue = (issue) => ({
  category: issue.category,
  location: issue.location,
  severity: issue.severity,
  description: issue.description,
  article_link: issue.article_link,
  publisher: issue.publisher,
  published_at: issue.published_at,
  source_tier: issue.source_tier,
  verification_status: issue.verification_status,
})

export const toAiSummary = (response) => ({
  path: response.path.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    arrive_at: point.arrive_at,
    // 기존에 저장된 경로 데이터에는 이 필드가 없을 수 있으며, 그 경우 undefined로 유지되어
    // CargoMap에서 해당 좌표의 핀 표시를 건너뛰는 기준으로 사용된다.
    point_type: point.point_type,
  })),
  summary: {
    delay_risk: response.summary.delay_risk,
    total_delay_hours: response.summary.total_delay_hours,
    eta_adjusted: response.summary.eta_adjusted,
    issues: response.summary.issues.map(toIssue),
    analysis_summary: response.summary.analysis_summary,
  },
})
