import { useCargoStore } from '../../store/useCargoStore'
import CargoList from '../CargoList/CargoList'
import './CargoListPanel.css'

function CargoListPanel() {
  const setPanelMode = useCargoStore((s) => s.setPanelMode)

  return (
    <aside className="cargo-list-panel">
      <div className="cargo-list-toolbar">
        <button className="btn-add" onClick={() => setPanelMode('add')}>+ 화물 추가</button>
      </div>
      <div className="cargo-list-scroll">
        <CargoList />
      </div>
    </aside>
  )
}

export default CargoListPanel
