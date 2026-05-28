FROM alpine:3.19

RUN apk add --no-cache \
    fail2ban \
    py3-inotify \
    iptables \
    ip6tables \
    bash

RUN mkdir -p /var/log/fail2ban /var/run/fail2ban /var/log/nginx

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
