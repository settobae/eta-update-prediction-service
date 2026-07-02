import { useCargoStore } from '../../store/useCargoStore'
import CargoForm from './CargoForm'
import './CargoFormModal.css'

function CargoFormModal() {
  const editingCargo = useCargoStore((s) => s.editingCargo)
  const closeEditForm = useCargoStore((s) => s.closeEditForm)

  if (!editingCargo) return null

  return (
    <div className="cargo-form-modal__overlay">
      <div className="cargo-form-modal__dialog">
        <CargoForm cargo={editingCargo} onClose={closeEditForm} />
      </div>
    </div>
  )
}

export default CargoFormModal
