# 🎙️ voxfix

**Dictado por voz con corrección por IA para [Omarchy](https://omarchy.org) (Hyprland / Wayland).**

Pulsa un atajo, habla, vuelve a pulsar. `voxfix` transcribe tu voz con
**Whisper.cpp** (local y privado) y luego pasa el resultado por **otra IA ultra
ligera** que **reformatea y corrige el texto** —puntuación, mayúsculas,
muletillas y frases incoherentes— antes de escribirlo en la ventana activa y
copiarlo al portapapeles.

Ligero, escrito en Bash, sin dependencias pesadas. Fiel al espíritu de Omarchy.

---

## ✨ Características

- **Voz → texto local** con Whisper.cpp (offline, privado, multilingüe con autodetección).
- **Corrección por IA configurable**, con dos backends:
  - **Ollama** (local, offline) con un modelo diminuto como `qwen2.5:0.5b`.
  - **Claude Haiku** (nube) vía API, para cero carga en tu máquina.
- **Activación por toggle**: un atajo empieza a grabar, el mismo lo para y transcribe.
- **Salida doble**: escribe en la ventana activa (`wtype`) **y** copia al portapapeles (`wl-copy`).
- **Integración con Hyprland y Waybar** (indicador de estado en la barra).
- **Degradación elegante**: si la IA no está disponible, usa el texto de Whisper sin corregir.

---

## 🚀 Instalación

```bash
git clone <este-repo> voxfix
cd voxfix
./install.sh
```

El instalador:

1. Instala dependencias con `pacman`: `wtype`, `wl-clipboard`, `jq`, `libnotify`, `ffmpeg`, `curl`.
2. Instala **whisper.cpp** desde el AUR (`whisper.cpp-vulkan` para GPU) y descarga el modelo `ggml-base`.
3. Si tienes **Ollama**, descarga el modelo `qwen2.5:0.5b` (si no, te dice cómo instalarlo).
4. Copia `voxfix` y `voxfix-waybar` a `~/.local/bin`.
5. Crea la config en `~/.config/voxfix/config`.

> Asegúrate de tener `~/.local/bin` en tu `PATH`.

Tras instalar, **comprueba que todo está correcto** con:

```bash
voxfix doctor
```

Imprime ✓/✗ por cada dependencia (whisper + modelo, audio, salida, IA) con la pista de
instalación cuando algo falte.

### Activar el atajo de Hyprland

Añade a `~/.config/hypr/hyprland.conf` (o copia [`config/hypr-voxfix.conf`](config/hypr-voxfix.conf) y sourcéalo):

```ini
bind = SUPER, D, exec, voxfix toggle
bind = SUPER SHIFT, D, exec, voxfix cancel
```

Recarga con `hyprctl reload`.

### Indicador en Waybar (opcional)

Sigue las instrucciones de [`config/waybar-voxfix.jsonc`](config/waybar-voxfix.jsonc):
añade el módulo `custom/voxfix` a tu config de Waybar y el CSS sugerido a `style.css`.
El icono cambia entre 🎙️ (listo), 🔴 (grabando) y ⏳ (procesando).

---

## 🎤 Uso

| Acción | Comando |
| --- | --- |
| Iniciar/parar dictado (toggle) | `voxfix toggle` |
| Iniciar grabación | `voxfix start` |
| Parar y transcribir | `voxfix stop` |
| Cancelar sin transcribir | `voxfix cancel` |
| Ver estado | `voxfix status` |

Flujo típico: **SUPER+D** → hablas → **SUPER+D** → el texto corregido aparece donde tengas el cursor.

---

## ⚙️ Configuración

Edita `~/.config/voxfix/config` (ver [`config/config.example`](config/config.example)):

```bash
# IA de corrección: "ollama" (local) | "claude" (nube) | "none"
BACKEND="ollama"

# Backend local
OLLAMA_MODEL="qwen2.5:0.5b"     # también: llama3.2:1b

# Backend nube (necesita: export ANTHROPIC_API_KEY="sk-ant-...")
CLAUDE_MODEL="claude-haiku-4-5-20251001"

# Whisper
WHISPER_MODEL="$HOME/.local/share/voxfix/models/ggml-base.bin"
WHISPER_LANG="auto"             # "auto" | "es" | "en" ...

# Salida: "both" | "type" | "clipboard"
OUTPUT_MODE="both"
```

### Usar Claude en lugar de Ollama

```bash
# en ~/.config/voxfix/config
BACKEND="claude"
# en ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Modelos de Whisper

`ggml-base` es un buen equilibrio. Para más precisión usa `ggml-small` (o `ggml-medium`);
descárgalos en `~/.local/share/voxfix/models/` y apunta `WHISPER_MODEL` a ellos.

---

## 🧩 Dependencias

| Componente | Uso | Paquete |
| --- | --- | --- |
| whisper.cpp | Transcripción (STT) | AUR `whisper.cpp` / `whisper.cpp-vulkan` |
| Ollama | IA de corrección local | AUR/`ollama` (opcional) |
| pw-record / ffmpeg | Captura de audio | `pipewire` (ya en Omarchy) / `ffmpeg` |
| wtype | Escribir en la ventana activa | `wtype` |
| wl-clipboard | Portapapeles | `wl-clipboard` |
| jq | Construir/leer JSON de la API | `jq` |
| libnotify | Notificaciones | `libnotify` |

---

## 🔧 Resolución de problemas

- **No escribe en la ventana**: instala `wtype` (`sudo pacman -S wtype`). Como respaldo, el texto queda en el portapapeles.
- **"modelo no encontrado"**: ejecuta `./install.sh` o descarga el modelo de Whisper manualmente.
- **La corrección no se aplica**: comprueba que Ollama está corriendo (`systemctl status ollama`) y que el modelo está descargado (`ollama list`); o cambia a `BACKEND="claude"`.
- **Logs**: revisa `~/.cache/voxfix/voxfix.log`.

---

## 📄 Licencia

MIT — ver [LICENSE](LICENSE).
