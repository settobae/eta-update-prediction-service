import CargoList from '../CargoList/CargoList'
import './CargoListPanel.css'

function CargoListPanel() {
  return (
    <aside className="cargo-list-panel">
      <div className="cargo-list-scroll">
        <CargoList />
      </div>
    </aside>
  )
}

export default CargoListPanel
