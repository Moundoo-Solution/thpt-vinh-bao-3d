#!/bin/sh
cd "$(dirname "$0")"
if command -v npm >/dev/null 2>&1 && [ -d node_modules ]; then
  echo "Nhiều người: http://localhost:8787"
  exec npm run dev
fi
echo "Một mình (không WebSocket): http://localhost:8765?nosync"
exec python3 -m http.server 8765
