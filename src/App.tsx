import Dashboard from './core/Dashboard'
import ChatPanel from './core/ChatPanel'

// NÚCLEO protegido: el andamiaje (cabecera + dashboard + chat). Claude no edita
// este fichero; añade y ajusta features en src/app-surface/.
export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1 className="app-title">Mi página viva</h1>
          <p className="app-subtitle">
            Habla con el chat y se irá construyendo sola.
          </p>
        </div>
      </header>

      <Dashboard />
      <ChatPanel />
    </div>
  )
}
