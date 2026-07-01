import './CargoListItem.css'

const getStatus = (cargo) => {
  if (cargo.ata) return 'done'
  if (cargo.eta && new Date(cargo.eta) < new Date()) return 'delayed'
  if (cargo.atd) return 'transit'
  return 'pending'
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })
}

function CargoListItem({ cargo, isSelected, onClick }) {
  const status = getStatus(cargo)
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
