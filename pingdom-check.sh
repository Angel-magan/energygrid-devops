#!/bin/sh
echo '[PINGDOM] Iniciando monitoreo de Uptime minuto a minuto...'
while true; do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://eg-gateway:3000/api/health)
  if [ "$STATUS" = "200" ]; then
    echo "[🟢 UPTIME OK] $(date) - El sistema responde correctamente (HTTP 200)"
  else
    echo "[🔴 UPTIME DOWN] $(date) - ¡ALERTA! El sistema no responde (HTTP $STATUS)"
  fi
  sleep 60
done