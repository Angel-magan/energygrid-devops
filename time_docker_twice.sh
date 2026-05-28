#!/bin/sh
echo "=== First run ==="
date +%s.%N
for c in eg-auth-db eg-auth-service eg-db eg-fail2ban eg-frontend eg-gateway eg-munin eg-simulator energygrid-devops-eg-backend-1 mi-db-mysql; do
    docker stats --no-stream --format "{{.CPUPerc}}" "$c" > /dev/null 2>&1
done
date +%s.%N
echo "=== Second run ==="
date +%s.%N
for c in eg-auth-db eg-auth-service eg-db eg-fail2ban eg-frontend eg-gateway eg-munin eg-simulator energygrid-devops-eg-backend-1 mi-db-mysql; do
    docker stats --no-stream --format "{{.CPUPerc}}" "$c" > /dev/null 2>&1
done
date +%s.%N
