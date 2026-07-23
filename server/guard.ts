import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

/** Raíz del proyecto = "la página". Claude Code no puede salir de aquí. */
export const PROJECT_ROOT = path.resolve(here, '..')

/**
 * Carpetas que Claude PUEDE escribir/editar (la "superficie editable"):
 *  - src/app-surface : componentes React de las features + estilos del tema
 *  - data            : memoria estructurada (eventos, notas...)
 *  - workspace       : memoria narrativa (MEMORY.md) e instrucciones (CLAUDE.md)
 *
 * El resto del proyecto (servidor, chat, dashboard, guard) es NÚCLEO protegido:
 * así Claude nunca puede romper su propio canal de comunicación ni el sandbox.
 */
export const WRITABLE_DIRS = [
  path.join(PROJECT_ROOT, 'src', 'app-surface'),
  path.join(PROJECT_ROOT, 'data'),
  path.join(PROJECT_ROOT, 'workspace'),
]

/** ¿Está esta ruta dentro de alguna carpeta escribible? */
export function isWritablePath(candidate: string | undefined): boolean {
  if (!candidate || typeof candidate !== 'string') return false
  const abs = path.resolve(PROJECT_ROOT, candidate)
  return WRITABLE_DIRS.some((dir) => abs === dir || abs.startsWith(dir + path.sep))
}
