import { useCargoStore } from '../../store/useCargoStore'
import logo from '../../assets/LogoSQ.png'
import './AppHeader.css'

function AppHeader() {
  const formOpen = useCargoStore((s) => s.formOpen)
  const toggleForm = useCargoStore((s) => s.toggleForm)

  return (
    <header className="app-header">
      <img src={logo} alt="Logo" className="app-header-logo" />
      <span className="app-header-title">Cargo Tracker</span>
      <button className="app-header-add-btn" onClick={toggleForm}>
        {formOpen ? '접기' : '+ 추가'}
      </button>
    </header>
  )
}

export default AppHeader
