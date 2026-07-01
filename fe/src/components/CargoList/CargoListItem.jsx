import { getCargoStatus, formatDate } from '../../utils/cargoUtils'
import './CargoListItem.css'

function CargoListItem({ cargo, isSelected, onClick }) {
  const status = getCargoStatus(cargo)
  const arrivalLabel = cargo.ata ? 'ATA' : 'ETA'
  const arrivalDate = formatDate(cargo.ata ?? cargo.eta)

  return (
    <div
      className={`cargo-list-item cargo-list-item--${status} ${isSelected ? 'cargo-list-item--selected' : ''}`}
      onClick={onClick}
    >
      <span className="cargo-list-item__project">{cargo.projectName}</span>
      <div className="cargo-list-item__meta">
        <span className="cargo-list-item__to">{cargo.to}</span>
        {arrivalDate && (
          <span className="cargo-list-item__date">
            {arrivalLabel} {arrivalDate}
          </span>
        )}
      </div>
    </div>
  )
}

export default CargoListItem
