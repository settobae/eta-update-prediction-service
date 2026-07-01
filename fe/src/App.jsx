import './App.css'

function App() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Cargo Tracker</h1>
      </header>

      <div className="app-body">
        <aside className="cargo-list-panel">
          {/* CargoList */}
        </aside>

        <main className="cargo-main-panel">
          {/* CargoDetail | CargoForm */}
        </main>
      </div>

      <footer className="app-footer">
        {/* Footer actions */}
      </footer>
    </div>
  )
}

export default App
