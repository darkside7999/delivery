# 🎙️ voxfix

**Dictado por voz con corrección por IA para [Omarchy](https://omarchy.org) (Hyprland / Wayland).**

Pulsa un atajo, habla, vuelve a pulsar. `voxfix` transcribe tu voz con
**Whisper.cpp** (local y privado) y luego pasa el resultado por **otra IA ultra
ligera** que **corrige el texto** —ortografía, tildes, puntuación y mayúsculas—
antes de escribirlo en la ventana activa y copiarlo al portapapeles.

Ligero, escrito en Bash, sin dependencias pesadas. Fiel al espíritu de Omarchy.

---

## ✨ Características

- **Voz → texto local** con Whisper.cpp (offline, privado, multilingüe).
- **Corrección por IA** que respeta tus palabras (no reescribe ni inventa), con varios backends:
  - **Ollama** (local, offline, rápido) — p. ej. `qwen2.5:7b` en GPU.
  - **Claude Code** — usa el CLI `claude` ya autenticado, **sin API key**.
  - **Claude API** (nube) con `ANTHROPIC_API_KEY`.
  - **none** — solo Whisper, sin corrección.
- **📖 Vocabulario personalizado**: declara tus nombres propios y reglas de
  reemplazo para que Whisper te oiga bien y el corrector no los estropee.
- **🎛️ Menú minimalista** (`voxfix-menu`): cambia backend, modelos, idioma, salida
  y vocabulario desde un lanzador (walker/fuzzel/wofi/rofi).
- **📋 Historial** de las últimas 20 transcripciones (`voxfix history`).
- **Activación por toggle**: un atajo empieza a grabar, el mismo lo para y transcribe.
- **Salida doble**: escribe en la ventana activa (`wtype`) **y** copia al portapapeles (`wl-copy`).
- **Indicador en Waybar** con estado en vivo (🎙️ listo · 🔴 grabando · ⏳ procesando).
- **Pre-carga del modelo** al empezar a grabar → corrección casi instantánea.
- **Robustez**: descarta alucinaciones de Whisper (silencio/ruido), rota el log y
  degrada con elegancia (si la IA falla, usa el texto de Whisper sin corregir).

---

## 🚀 Instalación

```bash
git clone <este-repo> voxfix
cd voxfix
./install.sh
```

El instalador instala dependencias, whisper.cpp y el modelo, y copia `voxfix`,
`voxfix-menu` y `voxfix-waybar` a `~/.local/bin`. Asegúrate de tener `~/.local/bin`
en tu `PATH`.

Tras instalar, **comprueba que todo está en orden** con `voxfix doctor`: imprime ✓/✗ por
cada dependencia (whisper + modelo, audio, salida, IA) con la pista de instalación cuando
algo falte.

### Atajos de Hyprland

Añade a `~/.config/hypr/hyprland.conf` (o copia [`config/hypr-voxfix.conf`](config/hypr-voxfix.conf) y sourcéalo):

```ini
bind = SUPER, D, exec, voxfix toggle        # dictar / parar
bind = SUPER CTRL, D, exec, voxfix cancel    # cancelar
bind = SUPER ALT, D, exec, voxfix-menu       # menú de configuración
```

Recarga con `hyprctl reload`.

> En Omarchy, **SUPER+SHIFT+D** suele estar ocupado (lazydocker) y **SUPER+Space**
> es el lanzador. Por eso se usan `CTRL` y `ALT` para cancelar y abrir el menú.

### Indicador en Waybar (opcional)

Sigue [`config/waybar-voxfix.jsonc`](config/waybar-voxfix.jsonc): añade el módulo
`custom/voxfix` a tu config de Waybar y el CSS sugerido a `style.css`.

---

## 🎤 Uso

| Acción | Comando |
| --- | --- |
| Iniciar/parar dictado (toggle) | `voxfix toggle` |
| Cancelar sin transcribir | `voxfix cancel` |
| Ver estado | `voxfix status` |
| Ver las últimas 20 transcripciones | `voxfix history` |
| Gestionar vocabulario | `voxfix vocab {list\|add "…"\|edit}` |
| Abrir el menú | `voxfix-menu` |

Flujo típico: **SUPER+D** → hablas → **SUPER+D** → el texto corregido aparece donde
tengas el cursor.

---

## 📖 Vocabulario personalizado

¿Whisper no entiende tu nombre, un término técnico o el nombre de una app? Decláralo
en `~/.config/voxfix/vocab.txt` (ver [`config/vocab.example`](config/vocab.example)).
Una entrada por línea, dos tipos:

```bash
# 1) Nombres / términos propios (mejoran a Whisper y los respeta el corrector)
Omarchy
Hyprland
voxfix

# 2) Reglas de reemplazo  ->  "lo que se oye = lo correcto"  (sin distinguir mayúsculas)
voz fix = voxfix
omar qui = Omarchy
```

Funciona en **tres capas** que se refuerzan:

1. **Whisper `--prompt`** — los términos sesgan la transcripción para que te oiga bien.
2. **Reemplazos literales** — las reglas `=` se aplican de forma fija y determinista.
3. **Glosario en el corrector** — la IA recibe tus formas correctas y corrige hacia
   ellas (p. ej. "boxfix" → "voxfix") sin tocar el resto.

Atajos: `voxfix vocab add "Hyprland"`, `voxfix vocab add "voz fix = voxfix"`,
`voxfix vocab edit`. O desde el menú → **📖 Mis palabras**.

---

## ⚙️ Configuración

Edita `~/.config/voxfix/config` (ver [`config/config.example`](config/config.example)):

```bash
# IA de corrección: "ollama" | "claude-code" | "claude" | "none"
BACKEND="ollama"

# Ollama (local). Con GPU, qwen2.5:7b es muy fiel y casi instantáneo.
OLLAMA_MODEL="qwen2.5:7b"        # más ligeros: qwen2.5:3b, qwen2.5:1.5b

# Claude Code (CLI ya autenticado, sin API key)
CLAUDE_CODE_MODEL="haiku"

# Claude API (necesita: export ANTHROPIC_API_KEY="sk-ant-...")
CLAUDE_MODEL="claude-haiku-4-5-20251001"

# Whisper
WHISPER_MODEL="$HOME/.local/share/voxfix/models/ggml-base.bin"
WHISPER_LANG="es"               # "es" | "auto" | "en" ...  (fija el idioma si auto falla)

# Salida: "both" | "type" | "clipboard"
OUTPUT_MODE="both"
```

> **Tip:** lo más cómodo es cambiar todo esto desde `voxfix-menu` (SUPER+ALT+D).

### Backends de corrección

- **`ollama`** — local y rápido; con GPU corrige en ~0.1–0.5 s. Requiere `ollama` y un
  modelo (`ollama pull qwen2.5:7b`).
- **`claude-code`** — usa el CLI `claude` ya autenticado; cero API key. Más lento
  (~varios s por el arranque del CLI).
- **`claude`** — API de Anthropic; necesita `ANTHROPIC_API_KEY`.
- **`none`** — solo Whisper.

### Modelos de Whisper

`ggml-base` es rápido pero impreciso. Para más precisión usa `ggml-small` o
`ggml-large-v3-turbo` (excelente, y rápido si tu whisper.cpp usa GPU). Apunta
`WHISPER_MODEL` al `.bin` que prefieras.

---

## 🧩 Dependencias

| Componente | Uso | Paquete |
| --- | --- | --- |
| whisper.cpp | Transcripción (STT) | AUR `whisper.cpp` / `whisper.cpp-vulkan` |
| Ollama | IA de corrección local | `ollama` / `ollama-cuda` (opcional) |
| pw-record / ffmpeg | Captura de audio | `pipewire` (ya en Omarchy) / `ffmpeg` |
| wtype | Escribir en la ventana activa | `wtype` |
| wl-clipboard | Portapapeles | `wl-clipboard` |
| jq | Construir/leer JSON | `jq` |
| libnotify | Notificaciones | `libnotify` |
| walker/fuzzel/wofi/rofi | Menú (`voxfix-menu`) | el de tu Omarchy |

---

## 🔧 Resolución de problemas

- **Empieza por aquí**: `voxfix doctor` comprueba todas las dependencias y la configuración.
- **No escribe en la ventana**: instala `wtype`. Como respaldo, el texto queda en el portapapeles.
- **Transcribe en otro idioma**: con frases cortas, `WHISPER_LANG="auto"` se equivoca;
  fíjalo a `"es"`.
- **El corrector reescribe/inventa**: usa un modelo que obedezca mejor (`qwen2.5:7b`) y
  añade tus términos al vocabulario.
- **La corrección no se aplica**: comprueba Ollama (`systemctl status ollama`,
  `ollama list`) o cambia de backend.
- **Logs**: `~/.cache/voxfix/voxfix.log` (se rota automáticamente).

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
