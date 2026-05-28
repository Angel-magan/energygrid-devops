#!/bin/sh
for c in eg-auth-db eg-auth-service eg-db eg-fail2ban eg-frontend eg-gateway eg-munin eg-simulator energygrid-devops-eg-backend-1 mi-db-mysql; do
    echo "=== $c ==="
    time docker stats --no-stream --format '{{.CPUPerc}}' "$c" 2>&1
    echo ""
done
