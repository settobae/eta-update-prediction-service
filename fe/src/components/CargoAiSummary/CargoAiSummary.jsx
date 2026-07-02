import { useCargoStore } from '../../store/useCargoStore'
import { formatDate } from '../../utils/cargoUtils'
import './CargoAiSummary.css'

const SEVERITY_LABEL = {
  High: '높음',
  Medium: '보통',
  Low: '낮음',
}

function CargoAiSummary() {
  const cargo = useCargoStore((s) => s.selectedCargo)
  const aiSummary = useCargoStore((s) => s.aiSummary)
  const loading = useCargoStore((s) => s.aiSummaryLoading)
  const error = useCargoStore((s) => s.aiSummaryError)
  const fetchAiSummary = useCargoStore((s) => s.fetchAiSummary)

  if (!cargo) return null

  const { delay_risk, total_delay_hours, eta_adjusted, issues, analysis_summary } = aiSummary.summary
  const hasResult = analysis_summary !== ''

  return (
    <div className="cargo-ai-summary">
      <div className="cargo-ai-summary__header">
        <div className="cargo-ai-summary__title-group">
          <span className="cargo-ai-summary__badge">AI</span>
          <h3 className="cargo-ai-summary__title">경로 위협 분석</h3>
        </div>
        <button
          type="button"
          className="cargo-ai-summary__refresh"
          onClick={() => fetchAiSummary(cargo.id)}
          disabled={loading}
        >
          {loading ? '분석 중…' : hasResult ? '다시 분석' : 'AI 분석 요청'}
        </button>
      </div>

      {error && <p className="cargo-ai-summary__error">분석 요청에 실패했습니다: {error}</p>}

      {!hasResult && !loading && !error && (
        <p className="cargo-ai-summary__placeholder">
          버튼을 눌러 AI에게 항로상 위협 요인과 예상 지연을 분석 요청하세요.
        </p>
      )}

      {loading && <p className="cargo-ai-summary__placeholder">경로와 최신 이슈를 분석하고 있습니다…</p>}

      {hasResult && !loading && (
        <>
          <p className="cargo-ai-summary__text">{analysis_summary}</p>

          <div className="cargo-ai-summary__stats">
            <div className="cargo-ai-summary__stat">
              <span className="cargo-ai-summary__stat-label">지연 위험도</span>
              <span className="cargo-ai-summary__stat-value cargo-ai-summary__stat-value--risk">{delay_risk}</span>
            </div>
            <div className="cargo-ai-summary__stat">
              <span className="cargo-ai-summary__stat-label">예상 지연</span>
              <span className="cargo-ai-summary__stat-value">{total_delay_hours}시간</span>
            </div>
            <div className="cargo-ai-summary__stat">
              <span className="cargo-ai-summary__stat-label">보정 ETA</span>
              <span className="cargo-ai-summary__stat-value">{formatDate(eta_adjusted) ?? '—'}</span>
            </div>
          </div>

          <div className="cargo-ai-summary__highlights">
            <span className="cargo-ai-summary__section-label">경로상 이슈 ({issues.length})</span>
            {issues.length === 0 ? (
              <p className="cargo-ai-summary__placeholder">보고된 이슈가 없습니다.</p>
            ) : (
              <ul className="cargo-ai-summary__issue-list">
                {issues.map((issue, i) => (
                  <li key={i} className="cargo-ai-summary__issue">
                    <div className="cargo-ai-summary__issue-header">
                      <span className="cargo-ai-summary__issue-category">{issue.category}</span>
                      <span className={`cargo-ai-summary__issue-severity cargo-ai-summary__issue-severity--${issue.severity?.toLowerCase()}`}>
                        {SEVERITY_LABEL[issue.severity] ?? issue.severity}
                      </span>
                    </div>
                    <p className="cargo-ai-summary__issue-desc">{issue.description}</p>
                    <div className="cargo-ai-summary__issue-meta">
                      <span>{issue.location}</span>
                      {issue.article_link && (
                        <a href={issue.article_link} target="_blank" rel="noreferrer">
                          {issue.publisher || '출처 보기'}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default CargoAiSummary
