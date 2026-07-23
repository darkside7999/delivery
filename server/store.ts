import { promises as fs } from 'node:fs'
import path from 'node:path'
import { PROJECT_ROOT } from './guard'

/**
 * Memoria estructurada de la página. Un simple JSON en data/store.json,
 * indexado por clave (normalmente el id de la feature). Las features del
 * frontend leen/escriben aquí vía /api/data/:key, y Claude lee el MISMO
 * fichero para "saber" qué hay en la página (eventos, notas, etc.).
 */
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')

type Store = Record<string, unknown>

async function readStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {}
  } catch {
    return {}
  }
}

async function writeStore(store: Store): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2) + '\n', 'utf8')
}

export async function getAll(): Promise<Store> {
  return readStore()
}

export async function getKey(key: string): Promise<unknown> {
  const store = await readStore()
  return store[key] ?? null
}

export async function setKey(key: string, value: unknown): Promise<void> {
  const store = await readStore()
  store[key] = value
  await writeStore(store)
}

/** Resumen corto de la memoria para inyectar en el contexto de Claude. */
export async function summarize(maxChars = 4000): Promise<string> {
  const store = await readStore()
  const text = JSON.stringify(store, null, 2)
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n… (truncado)'
}
