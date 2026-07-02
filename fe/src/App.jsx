import './App.css'
import { useCargoStore } from './store/useCargoStore'
import AppHeader from './components/AppHeader/AppHeader'
import CargoForm from './components/CargoForm/CargoForm'
import CargoListPanel from './components/CargoListPanel/CargoListPanel'
import CargoMainPanel from './components/CargoMainPanel/CargoMainPanel'
import AppFooter from './components/AppFooter/AppFooter'
import Toast from './components/Toast/Toast'

function App() {
  const formOpen = useCargoStore((s) => s.formOpen)

  return (
    <div className="app-layout">
      <AppHeader />
      {formOpen && <CargoForm />}
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
