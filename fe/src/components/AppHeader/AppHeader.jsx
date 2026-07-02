import logo from '../../assets/LogoSQ.png'
import './AppHeader.css'

function AppHeader() {
  return (
    <header className="app-header">
      <img src={logo} alt="Logo" className="app-header-logo" />
      <span className="app-header-title">Cargo Tracker</span>
    </header>
  )
}

export default AppHeader
