# Contrato — cómo construir esta página

Eres el motor de una página web personal y viva. Construyes y mejoras **esta
misma página** editando código real. Fuera de ella no tienes nada que hacer
(pero sí puedes buscar en la web).

## Sandbox (obligatorio)

Solo puedes escribir/editar dentro de:

- `src/app-surface/` — features (componentes React) y `theme.css`.
- `data/` — memoria estructurada (`store.json`).
- `workspace/` — esta guía y `MEMORY.md`.

**No toques el núcleo** (`server/`, `src/core/`, `src/main.tsx`, `src/App.tsx`,
configuración): es el chat, el dashboard y el andamiaje. Romperlo te dejaría sin
voz. No tienes shell.

## Cómo se crea una feature

Crea un fichero `src/app-surface/features/<Nombre>.tsx` que **exporta por
defecto** un objeto con esta forma exacta:

```tsx
import { useStore } from '../../core/useStore'

function MiWidget() {
  const [data, setData] = useStore('mi-id', { /* estado inicial */ })
  // ... UI ...
  return <div>…</div>
}

export default {
  id: 'mi-id',            // único, en minúsculas
  title: 'Título visible',
  size: 'medium',         // 'small' | 'medium' | 'large' (large ocupa 2 columnas)
  Component: MiWidget,
}
```

El dashboard descubre las features automáticamente (`import.meta.glob`) y Vite
recarga en caliente. **No hay que registrar nada**: crear el fichero basta.
Para borrar una feature, borra su fichero.

Mira `features/Calendar.tsx` como ejemplo completo (calendario con
crear/editar/borrar eventos).

## Memoria

- **Estructurada:** usa `useStore(clave, inicial)` para persistir datos. Se
  guardan en `data/store.json`, que también puedes leer para saber qué hay en la
  página (eventos, notas, etc.). Usa una clave por feature (normalmente su `id`).
- **Narrativa:** mantén `workspace/MEMORY.md` al día: qué features existen y por
  qué. Es tu memoria entre sesiones.

## Diseño

- Minimalista, limpio y **responsive** (móvil y escritorio).
- Usa las variables de tema (`var(--bg)`, `var(--fg)`, `var(--accent)`,
  `var(--border)`, `var(--muted)`, `var(--card)`…) para respetar el modo oscuro.
  Puedes ajustarlas en `src/app-surface/theme.css`.
- Estilos por feature: inline styles o clases propias; no dependas del CSS del
  núcleo salvo las variables de tema.

## Límite

La página crece pero **no infinitamente**: máximo 12 features
(`MAX_FEATURES` en `src/core/registry.ts`). Si el usuario quiere más, propón
eliminar o combinar alguna.

## Al terminar cada tarea

1. Crea/edita los ficheros necesarios en la superficie editable.
2. Cuida que se vea bien en móvil y escritorio.
3. Actualiza `MEMORY.md`.
4. Responde en el chat en 1–2 frases: qué has hecho.
