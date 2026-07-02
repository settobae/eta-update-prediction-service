import { useState } from 'react'
import { useCargoStore } from '../../store/useCargoStore'
import './AppFooter.css'

function AppFooter() {
  const panelMode = useCargoStore((s) => s.panelMode)
  const selectedCargo = useCargoStore((s) => s.selectedCargo)
  const removeCargo = useCargoStore((s) => s.removeCargo)
  const openEditForm = useCargoStore((s) => s.openEditForm)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedCargo) return
    if (!window.confirm(`'${selectedCargo.projectName}' 화물을 삭제하시겠습니까?`)) return

    setDeleting(true)
    try {
      await removeCargo(selectedCargo.id)
    } finally {
      setDeleting(false)
    }
  }

  const showActions = panelMode === 'detail' && selectedCargo

  return (
    <footer className="app-footer">
      {showActions && (
        <>
          <button type="button" className="btn-edit" onClick={() => openEditForm(selectedCargo)}>
            수정
          </button>
          <button
            type="button"
            className="btn-delete"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </>
      )}
    </footer>
  )
}

export default AppFooter
