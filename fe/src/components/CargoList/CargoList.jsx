import { useEffect } from 'react'
import { useCargoStore } from '../../store/useCargoStore'
import CargoListItem from './CargoListItem'
import './CargoList.css'

function CargoList() {
  const { cargos, loading, error, selectedCargo, fetchCargos, selectCargo } = useCargoStore()

  useEffect(() => {
    fetchCargos()
  }, [])

  if (loading) return <div className="cargo-list-state">불러오는 중...</div>
  if (error)   return <div className="cargo-list-state cargo-list-state--error">{error}</div>
  if (!cargos.length) return <div className="cargo-list-state">화물 내역이 없습니다.</div>

  return (
    <div className="cargo-list">
      {cargos.map((cargo) => (
        <CargoListItem
          key={cargo.id}
          cargo={cargo}
          isSelected={selectedCargo?.id === cargo.id}
          onClick={() => selectCargo(cargo)}
        />
      ))}
    </div>
  )
}

export default CargoList
