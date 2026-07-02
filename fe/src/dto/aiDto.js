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
  })),
  summary: {
    delay_risk: response.summary.delay_risk,
    total_delay_hours: response.summary.total_delay_hours,
    eta_adjusted: response.summary.eta_adjusted,
    issues: response.summary.issues.map(toIssue),
    analysis_summary: response.summary.analysis_summary,
  },
})
