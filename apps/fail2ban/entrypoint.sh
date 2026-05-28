#!/bin/sh
set -e
mkdir -p /var/run/fail2ban /var/log/fail2ban /var/log/nginx

# Crear jail.local base si no existe
if [ ! -f /etc/fail2ban/jail.local ]; then
  cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
banaction = dummy
logtarget = /var/log/fail2ban/fail2ban.log
loglevel = INFO
EOF
fi

exec fail2ban-server -f -x --loglevel INFO --logtarget /var/log/fail2ban/fail2ban.log