import { useCargoStore } from '../../store/useCargoStore'
import './CargoAiSummary.css'

// TODO: AI 요약 API 연동 전까지 사용하는 목업 데이터 (디자인 검토용)
const MOCK_SUMMARY = {
  text:
    '경유지 통관 절차가 예정보다 지연되며 전체 일정이 2일가량 늦어지고 있습니다. 현재 이동 속도를 유지할 경우 ETA 기준 3일 이내 도착이 예상됩니다.',
  risk: '주의',
  confidence: '82%',
  updatedAt: '5분 전',
  highlights: [
    '경유지 통관 지연이 전체 일정 지연의 주요 원인',
    '해상 구간 이동 속도는 평균 대비 정상 범위',
    '현재 추세 유지 시 최종 도착 지연 예상',
  ],
}

function CargoAiSummary() {
  const cargo = useCargoStore((s) => s.selectedCargo)
  if (!cargo) return null

  const { text, risk, confidence, updatedAt, highlights } = MOCK_SUMMARY

  return (
    <div className="cargo-ai-summary">
      <div className="cargo-ai-summary__header">
        <div className="cargo-ai-summary__title-group">
          <span className="cargo-ai-summary__badge">AI</span>
          <h3 className="cargo-ai-summary__title">요약</h3>
        </div>
        <span className="cargo-ai-summary__updated">{updatedAt} 업데이트</span>
      </div>

      <p className="cargo-ai-summary__text">{text}</p>

      <div className="cargo-ai-summary__stats">
        <div className="cargo-ai-summary__stat">
          <span className="cargo-ai-summary__stat-label">리스크</span>
          <span className="cargo-ai-summary__stat-value cargo-ai-summary__stat-value--risk">{risk}</span>
        </div>
        <div className="cargo-ai-summary__stat">
          <span className="cargo-ai-summary__stat-label">신뢰도</span>
          <span className="cargo-ai-summary__stat-value">{confidence}</span>
        </div>
      </div>

      <div className="cargo-ai-summary__highlights">
        <span className="cargo-ai-summary__section-label">주요 포인트</span>
        <ul className="cargo-ai-summary__highlight-list">
          {highlights.map((item, i) => (
            <li key={i} className="cargo-ai-summary__highlight-item">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default CargoAiSummary
