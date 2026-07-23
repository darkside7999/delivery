import { useState, type CSSProperties } from 'react'
import { useStore } from '../../core/useStore'

/**
 * Feature DEMO: un calendario mensual con eventos (crear / editar / borrar).
 * Sirve de referencia para el contrato de features. Los eventos se guardan en
 * la memoria de la página (data/store.json, clave "calendar"), que Claude
 * también puede leer.
 */

interface CalEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
}
interface CalData {
  events: CalEvent[]
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function key(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

// Índice del lunes = 0 … domingo = 6
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7
}

function CalendarWidget() {
  const [data, setData] = useStore<CalData>('calendar', { events: [] })
  const events = data.events ?? []

  const today = new Date()
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const [selected, setSelected] = useState<string>(
    key(today.getFullYear(), today.getMonth(), today.getDate()),
  )
  const [draft, setDraft] = useState('')

  const firstDay = new Date(view.y, view.m, 1)
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const leading = mondayIndex(firstDay.getDay())
  const cells: (number | null)[] = [
    ...Array(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const countByDate = new Map<string, number>()
  for (const e of events) countByDate.set(e.date, (countByDate.get(e.date) ?? 0) + 1)

  const selectedEvents = events
    .filter((e) => e.date === selected)
    .sort((a, b) => a.title.localeCompare(b.title))

  function move(delta: number) {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }
  function goToday() {
    const d = new Date()
    setView({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(key(d.getFullYear(), d.getMonth(), d.getDate()))
  }
  function addEvent() {
    const title = draft.trim()
    if (!title) return
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.random())
    setData({ events: [...events, { id, date: selected, title }] })
    setDraft('')
  }
  function editEvent(ev: CalEvent) {
    const next = window.prompt('Editar evento:', ev.title)
    if (next === null) return
    const title = next.trim()
    setData({
      events: title
        ? events.map((e) => (e.id === ev.id ? { ...e, title } : e))
        : events.filter((e) => e.id !== ev.id),
    })
  }
  function deleteEvent(id: string) {
    setData({ events: events.filter((e) => e.id !== id) })
  }

  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div>
      <div style={S.head}>
        <button style={S.nav} onClick={() => move(-1)} aria-label="Mes anterior">‹</button>
        <div style={S.monthLabel}>
          {MONTHS[view.m]} {view.y}
        </div>
        <button style={S.nav} onClick={() => move(1)} aria-label="Mes siguiente">›</button>
        <button style={S.today} onClick={goToday}>hoy</button>
      </div>

      <div style={S.grid}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={S.weekday}>{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const k = key(view.y, view.m, day)
          const count = countByDate.get(k) ?? 0
          const isSel = k === selected
          const isToday = k === todayKey
          return (
            <button
              key={i}
              onClick={() => setSelected(k)}
              style={{
                ...S.day,
                ...(isSel ? S.daySel : null),
                ...(isToday && !isSel ? S.dayToday : null),
              }}
            >
              <span>{day}</span>
              {count > 0 && <span style={isSel ? S.dotSel : S.dot} />}
            </button>
          )
        })}
      </div>

      <div style={S.panel}>
        <div style={S.panelTitle}>{selected}</div>
        {selectedEvents.length === 0 && <div style={S.empty}>Sin eventos este día.</div>}
        {selectedEvents.map((ev) => (
          <div key={ev.id} style={S.row}>
            <span style={S.rowTitle}>{ev.title}</span>
            <button style={S.iconBtn} onClick={() => editEvent(ev)} aria-label="Editar">✎</button>
            <button style={S.iconBtn} onClick={() => deleteEvent(ev.id)} aria-label="Borrar">🗑</button>
          </div>
        ))}
        <div style={S.addRow}>
          <input
            style={S.input}
            value={draft}
            placeholder="Nuevo evento…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
          />
          <button style={S.addBtn} onClick={addEvent} disabled={!draft.trim()}>Añadir</button>
        </div>
      </div>
    </div>
  )
}

const S: Record<string, CSSProperties> = {
  head: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  monthLabel: { flex: 1, textAlign: 'center', fontWeight: 600, textTransform: 'capitalize' },
  nav: {
    border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit',
    borderRadius: 8, width: 30, height: 30, fontSize: 18, lineHeight: 1,
  },
  today: {
    border: 'none', background: 'transparent', color: 'var(--accent)',
    fontWeight: 600, fontSize: 13,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  weekday: { textAlign: 'center', fontSize: 11, color: 'var(--muted)', padding: '4px 0' },
  day: {
    position: 'relative', aspectRatio: '1 / 1', border: '1px solid transparent',
    background: 'var(--bg)', color: 'inherit', borderRadius: 10, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  daySel: { background: 'var(--accent)', color: '#fff' },
  dayToday: { borderColor: 'var(--accent)' },
  dot: {
    position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: '50%',
    background: 'var(--accent)',
  },
  dotSel: {
    position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: '50%',
    background: '#fff',
  },
  panel: { marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 },
  panelTitle: { fontSize: 12, color: 'var(--muted)', marginBottom: 8 },
  empty: { fontSize: 13, color: 'var(--muted)', padding: '4px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' },
  rowTitle: { flex: 1, fontSize: 14 },
  iconBtn: {
    border: 'none', background: 'transparent', color: 'var(--muted)', fontSize: 14, padding: 4,
  },
  addRow: { display: 'flex', gap: 6, marginTop: 8 },
  input: {
    flex: 1, border: '1px solid var(--border)', background: 'var(--bg)', color: 'inherit',
    borderRadius: 8, padding: '8px 10px', font: 'inherit', fontSize: 14,
  },
  addBtn: {
    border: 'none', background: 'var(--accent)', color: '#fff', borderRadius: 8,
    padding: '0 12px', fontWeight: 600,
  },
}

export default {
  id: 'calendar',
  title: 'Calendario',
  size: 'large' as const,
  Component: CalendarWidget,
}
