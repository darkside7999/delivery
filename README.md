# Mi página viva

Una página web personal que **Claude Code va construyendo y mejorando** a medida
que conversas con ella. Empieza como un chat; le pides cosas («créame un
calendario», «añade una lista de tareas») y Claude escribe código real dentro de
la propia página, que se recarga en vivo. Claude solo puede tocar esta página
(más búsquedas web): nada fuera de ella.

## Cómo funciona

- **Frontend** (Vite + React + TypeScript): un dashboard de _features_ y un chat
  plegable, minimalista y responsive.
- **Backend** (Express) embebe el **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`),
  o sea "Claude Code" como motor. El chat manda tus mensajes a `query()` y
  devuelve la respuesta en streaming (SSE).
- **Sandbox:** Claude solo puede escribir en `src/app-surface/`, `data/` y
  `workspace/`. El núcleo (servidor, chat, dashboard) está protegido por un
  guard (`server/guard.ts` + `canUseTool`), y no tiene shell. Sí tiene búsqueda
  web.
- **Auto-mejora:** cada feature es un fichero en `src/app-surface/features/*.tsx`.
  El dashboard las descubre solas (`import.meta.glob`) y Vite hace _hot reload_.
- **Memoria:** los datos de las features se guardan en `data/store.json` (Claude
  lee ese mismo fichero); además Claude mantiene `workspace/MEMORY.md`.
- **Límite:** máximo 12 features (`MAX_FEATURES`), para que crezca pero no sin
  fin.

## Puesta en marcha

```bash
npm install
cp .env.example .env    # y pon tu ANTHROPIC_API_KEY
npm run dev
```

Abre http://localhost:5173

- El **Agent SDK necesita su propia `ANTHROPIC_API_KEY`** de Anthropic (no usa
  la suscripción de Claude.ai). Consíguela en https://console.anthropic.com/.
- **Sin clave**, la app funciona igual (dashboard, calendario, memoria); solo el
  chat mostrará un aviso de configuración en vez de responder.

## Producción

```bash
npm run build   # genera dist/
npm start       # Express sirve dist/ y la API en el puerto 8787 (o $PORT)
```

## Estructura

```
server/            # backend protegido (Express + Agent SDK + guard + memoria)
src/core/          # núcleo del frontend (chat, dashboard, useStore) — protegido
src/app-surface/   # SUPERFICIE EDITABLE por Claude (features + theme.css)
data/store.json    # memoria estructurada
workspace/         # CLAUDE.md (contrato) + MEMORY.md (memoria narrativa)
```

## Para el que edita: el contrato de features

Cada feature exporta por defecto `{ id, title, size, Component }`. Mira
`src/app-surface/features/Calendar.tsx` y `workspace/CLAUDE.md`.
