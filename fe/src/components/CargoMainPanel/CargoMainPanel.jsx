import { useCargoStore } from '../../store/useCargoStore'
import CargoForm from '../CargoForm/CargoForm'
import CargoDetail from '../CargoDetail/CargoDetail'
import './CargoMainPanel.css'

function CargoMainPanel() {
  const panelMode = useCargoStore((s) => s.panelMode)

  return (
    <main className="cargo-main-panel">
      {panelMode === 'idle' && (
        <div className="cargo-main-panel__empty">화물을 선택하거나 추가하세요.</div>
      )}
      {(panelMode === 'add' || panelMode === 'edit') && <CargoForm />}
      {panelMode === 'detail' && <CargoDetail />}
    </main>
  )
}

export default CargoMainPanel
