import { useCargoStore } from '../../store/useCargoStore'
import { getCargoStatus, STATUS_LABEL, formatDate } from '../../utils/cargoUtils'
import CargoMap from '../CargoMap/CargoMap'
import './CargoDetail.css'

const MAP_INITIAL_CENTER = [131.865, 37.243]
const MAP_INITIAL_ZOOM = 3

const getDelayText = (ata, eta) => {
  if (!ata || !eta) return null
  const days = Math.round((new Date(ata) - new Date(eta)) / (1000 * 60 * 60 * 24))
  if (days === 0) return '정시 도착'
  if (days > 0) return `+${days}일 지연`
  return `${Math.abs(days)}일 조기 도착`
}

function CargoDetail() {
  const cargo = useCargoStore((s) => s.selectedCargo)
  const aiSummary = useCargoStore((s) => s.aiSummary)
  if (!cargo) return null

  const status = getCargoStatus(cargo)
  const delayText = getDelayText(cargo.ata, cargo.eta)
  const isDelayed = cargo.ata && cargo.eta && new Date(cargo.ata) > new Date(cargo.eta)

  return (
    <div className="cargo-detail">

      <div className="cargo-detail__header">
        <h2 className="cargo-detail__project">{cargo.projectName}</h2>
        <span className={`cargo-detail__badge cargo-detail__badge--${status}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="cargo-detail__route">
        <div className="cargo-detail__route-stop">
          <span className="cargo-detail__route-label">출발지</span>
          <span className="cargo-detail__route-value">{cargo.from}</span>
        </div>
        <div className="cargo-detail__route-line">→</div>
        {cargo.stopover && (
          <>
            <div className="cargo-detail__route-stop cargo-detail__route-stop--center">
              <span className="cargo-detail__route-label">경유지</span>
              <span className="cargo-detail__route-value">{cargo.stopover}</span>
            </div>
            <div className="cargo-detail__route-line">→</div>
          </>
        )}
        <div className="cargo-detail__route-stop cargo-detail__route-stop--end">
          <span className="cargo-detail__route-label">도착지</span>
          <span className="cargo-detail__route-value">{cargo.to}</span>
        </div>
      </div>

      <div className="cargo-detail__dates">
        <div className="cargo-detail__date-item">
          <span className="cargo-detail__date-label">ATD</span>
          <span className="cargo-detail__date-value">{formatDate(cargo.atd) ?? '—'}</span>
        </div>
        <div className="cargo-detail__date-item">
          <span className="cargo-detail__date-label">ETA</span>
          <span className="cargo-detail__date-value">{formatDate(cargo.eta) ?? '—'}</span>
        </div>
        <div className="cargo-detail__date-item">
          <span className="cargo-detail__date-label">ATA</span>
          <span className="cargo-detail__date-value">{formatDate(cargo.ata) ?? '—'}</span>
          {delayText && (
            <span className={`cargo-detail__delay${isDelayed ? ' cargo-detail__delay--late' : ''}`}>
              ({delayText})
            </span>
          )}
        </div>
      </div>

      <div className="cargo-detail__items">
        <span className="cargo-detail__section-label">품목</span>
        <table className="cargo-detail__table">
          <thead>
            <tr>
              <th>품목명</th>
              <th>수량</th>
            </tr>
          </thead>
          <tbody>
            {cargo.items.map((item, i) => (
              <tr key={i}>
                <td>{item.item}</td>
                <td>{item.ea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CargoMap
        from={cargo.from}
        stopover={cargo.stopover}
        to={cargo.to}
        center={MAP_INITIAL_CENTER}
        zoom={MAP_INITIAL_ZOOM}
        route={aiSummary?.path}
      />

    </div>
  )
}

export default CargoDetail
