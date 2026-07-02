// be/app/dto/ai_dto.py의 AISummaryResponse에 대응
export const EMPTY_AI_SUMMARY = {
  path: [],
  summary: { data: '' },
}

export const toAiSummary = (response) => ({
  path: response.path.map((point) => ({
    lat: point.lat,
    lon: point.lon,
    arrive_at: point.arrive_at,
  })),
  summary: { data: response.summary.data },
})
