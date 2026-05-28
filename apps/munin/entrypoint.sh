#!/bin/sh
set -e

mkdir -p /var/run/munin /var/log/munin /var/lib/munin/www /run/apache2

chown -R munin:munin /var/lib/munin /var/log/munin /var/run/munin 2>/dev/null || true

httpd -k start 2>/dev/null || true

munin-node &

echo "Starting munin-cron loop..."
while true; do
    su -s /bin/sh munin -c "/usr/bin/munin-cron" 2>/dev/null || true
    sleep 300
done