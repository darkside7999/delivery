#!/usr/bin/env bash
#
# install.sh — Instalador de voxfix para Omarchy / Arch Linux (Hyprland).
#
# Instala dependencias, whisper.cpp + un modelo, opcionalmente Ollama + un
# modelo diminuto, y copia los binarios y la config por defecto.
#
set -euo pipefail

# --- rutas ------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DST="$HOME/.local/bin"
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/voxfix"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/voxfix"
MODEL_DIR="$DATA_DIR/models"
WHISPER_MODEL_NAME="ggml-base.bin"
WHISPER_MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
OLLAMA_MODEL="qwen2.5:0.5b"

c()  { printf '\033[1;35m==>\033[0m %s\n' "$*"; }
ok() { printf '\033[1;32m  ok\033[0m %s\n' "$*"; }
warn(){ printf '\033[1;33m  !!\033[0m %s\n' "$*"; }

have() { command -v "$1" >/dev/null 2>&1; }

# --- 1) dependencias del sistema -------------------------------------------
c "Instalando dependencias del sistema (pacman)…"
PKGS=(wtype wl-clipboard jq libnotify ffmpeg curl)
if have pacman; then
    sudo pacman -S --needed --noconfirm "${PKGS[@]}" || warn "Revisa la salida de pacman"
    ok "Dependencias base instaladas"
else
    warn "No se encontró pacman; instala manualmente: ${PKGS[*]}"
fi

# --- 2) whisper.cpp ---------------------------------------------------------
c "Comprobando whisper.cpp…"
if have whisper-cli; then
    ok "whisper-cli ya está instalado"
else
    if have yay; then
        # whisper.cpp-vulkan acelera por GPU en Omarchy; cae a whisper.cpp si falla.
        yay -S --needed --noconfirm whisper.cpp-vulkan || \
        yay -S --needed --noconfirm whisper.cpp || \
        warn "No se pudo instalar whisper.cpp por yay; instálalo a mano (AUR)."
    else
        warn "No se encontró yay. Instala whisper.cpp desde el AUR:"
        warn "  yay -S whisper.cpp        (o whisper.cpp-vulkan para GPU)"
        warn "El binario debe llamarse 'whisper-cli' y estar en el PATH."
    fi
fi

# --- 3) modelo de Whisper ---------------------------------------------------
c "Descargando modelo de Whisper ($WHISPER_MODEL_NAME)…"
mkdir -p "$MODEL_DIR"
if [ -f "$MODEL_DIR/$WHISPER_MODEL_NAME" ]; then
    ok "El modelo ya existe: $MODEL_DIR/$WHISPER_MODEL_NAME"
else
    curl -fL --progress-bar "$WHISPER_MODEL_URL" -o "$MODEL_DIR/$WHISPER_MODEL_NAME" \
        && ok "Modelo descargado en $MODEL_DIR/$WHISPER_MODEL_NAME" \
        || warn "Fallo al descargar el modelo; descárgalo manualmente desde $WHISPER_MODEL_URL"
fi

# --- 4) Ollama + modelo diminuto (backend local de corrección) -------------
c "Comprobando Ollama (IA de corrección local)…"
if have ollama; then
    ok "Ollama instalado"
    if ollama list 2>/dev/null | grep -q "${OLLAMA_MODEL%%:*}"; then
        ok "Modelo $OLLAMA_MODEL ya disponible"
    else
        c "Descargando modelo $OLLAMA_MODEL…"
        ollama pull "$OLLAMA_MODEL" || warn "No se pudo descargar $OLLAMA_MODEL; hazlo con: ollama pull $OLLAMA_MODEL"
    fi
else
    warn "Ollama no está instalado. Para la corrección local ejecuta:"
    warn "  yay -S ollama   (o: sudo pacman -S ollama)"
    warn "  systemctl enable --now ollama"
    warn "  ollama pull $OLLAMA_MODEL"
    warn "Alternativa: pon BACKEND=\"claude\" en la config y exporta ANTHROPIC_API_KEY."
fi

# --- 5) binarios ------------------------------------------------------------
c "Instalando binarios en $BIN_DST…"
mkdir -p "$BIN_DST"
install -m 0755 "$SCRIPT_DIR/bin/voxfix"          "$BIN_DST/voxfix"
install -m 0755 "$SCRIPT_DIR/bin/voxfix-waybar"   "$BIN_DST/voxfix-waybar"
ok "voxfix y voxfix-waybar instalados"

case ":$PATH:" in
    *":$BIN_DST:"*) ;;
    *) warn "$BIN_DST no está en tu PATH. Añádelo en ~/.bashrc:  export PATH=\"\$HOME/.local/bin:\$PATH\"" ;;
esac

# --- 6) config por defecto --------------------------------------------------
c "Instalando configuración…"
mkdir -p "$CONFIG_DIR"
if [ -f "$CONFIG_DIR/config" ]; then
    ok "Config existente conservada: $CONFIG_DIR/config"
    cp "$SCRIPT_DIR/config/config.example" "$CONFIG_DIR/config.example"
else
    cp "$SCRIPT_DIR/config/config.example" "$CONFIG_DIR/config"
    ok "Config creada: $CONFIG_DIR/config"
fi

# --- 7) instrucciones finales ----------------------------------------------
cat <<EOF

$(c "¡Instalación completada!")

Siguientes pasos:

  1) Atajo de Hyprland — añade a ~/.config/hypr/hyprland.conf:
       bind = SUPER, D, exec, voxfix toggle
     (o copia config/hypr-voxfix.conf y sourcéalo)

  2) Indicador de Waybar (opcional) — usa config/waybar-voxfix.jsonc
     para añadir el módulo "custom/voxfix" y el CSS sugerido.

  3) Recarga Hyprland (SUPER+ESC o 'hyprctl reload') y Waybar.

  4) Comprueba que todo está en orden:
       voxfix doctor

  5) Pulsa SUPER+D, habla, pulsa otra vez. El texto corregido se escribirá
     en la ventana activa y se copiará al portapapeles.

Ajusta el backend de la IA en: $CONFIG_DIR/config
EOF
