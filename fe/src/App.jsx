import './App.css'
import AppHeader from './components/AppHeader/AppHeader'
import CargoListPanel from './components/CargoListPanel/CargoListPanel'
import CargoMainPanel from './components/CargoMainPanel/CargoMainPanel'
import AppFooter from './components/AppFooter/AppFooter'
import Toast from './components/Toast/Toast'

function App() {
  return (
    <div className="app-layout">
      <AppHeader />
      <div className="app-body">
        <CargoListPanel />
        <CargoMainPanel />
      </div>
      <AppFooter />
      <Toast />
    </div>
  )
}

export default App
