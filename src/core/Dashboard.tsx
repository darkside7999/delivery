import { Component, type ErrorInfo, type ReactNode } from 'react'
import { features, MAX_FEATURES, type Feature } from './registry'

/**
 * Aísla los fallos de una feature (código que Claude escribe en vivo) para que
 * un error en un widget no tumbe toda la página ni el chat.
 */
class WidgetBoundary extends Component<
  { title: string; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[widget:${this.props.title}]`, error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="widget widget-error">
          <div className="widget-title">{this.props.title}</div>
          <div>Esta feature falló al renderizar. Pídele a Claude que la revise.</div>
        </div>
      )
    }
    return this.props.children
  }
}

function Widget({ feature }: { feature: Feature }) {
  const { title, size = 'medium', Component: Body } = feature
  return (
    <WidgetBoundary title={title}>
      <section className={`widget size-${size}`}>
        <h2 className="widget-title">{title}</h2>
        <Body />
      </section>
    </WidgetBoundary>
  )
}

export default function Dashboard() {
  const shown = features.slice(0, MAX_FEATURES)
  const overflow = features.length - shown.length

  return (
    <main className="dashboard">
      {shown.length === 0 && (
        <div className="dashboard-empty">
          Todavía no hay nada aquí. Abre el chat y pídele a Claude que cree algo,
          por ejemplo: <em>«créame un calendario»</em>.
        </div>
      )}
      {shown.map((f) => (
        <Widget key={f.id} feature={f} />
      ))}
      {overflow > 0 && (
        <div className="cap-note">
          Se alcanzó el tope de {MAX_FEATURES} features ({overflow} ocultas). Pídele a
          Claude que elimine o combine alguna para añadir más.
        </div>
      )}
    </main>
  )
}
