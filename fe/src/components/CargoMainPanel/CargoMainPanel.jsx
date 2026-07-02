import { useCargoStore } from '../../store/useCargoStore'
import CargoDetail from '../CargoDetail/CargoDetail'
import CargoAiSummary from '../CargoAiSummary/CargoAiSummary'
import './CargoMainPanel.css'

function CargoMainPanel() {
  const panelMode = useCargoStore((s) => s.panelMode)

  return (
    <main className="cargo-main-panel">
      <div className="cargo-main-panel__left">
        {panelMode === 'idle' && (
          <div className="cargo-main-panel__empty">화물을 선택하거나 추가하세요.</div>
        )}
        {panelMode === 'detail' && <CargoDetail />}
      </div>

      {panelMode === 'detail' && (
        <>
          <div className="cargo-main-panel__divider" />
          <div className="cargo-main-panel__right">
            <CargoAiSummary />
          </div>
        </>
      )}
    </main>
  )
}

export default CargoMainPanel
