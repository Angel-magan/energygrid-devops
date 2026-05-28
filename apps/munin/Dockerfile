FROM alpine:3.19

RUN apk add --no-cache \
    apache2 \
    apache2-utils \
    munin \
    munin-node \
    docker-cli \
    bash \
    curl \
    tzdata \
    coreutils

RUN sed -i 's/Listen 80/Listen 4948/' /etc/apache2/httpd.conf

RUN mkdir -p /run/apache2 /var/lib/munin /var/log/munin /var/run/munin

COPY conf/munin.conf /etc/munin/munin.conf
COPY conf/apache-munin.conf /etc/apache2/conf.d/munin.conf

COPY plugins/docker_cpu /usr/lib/munin/plugins/docker_cpu
COPY plugins/docker_mem /usr/lib/munin/plugins/docker_mem
COPY plugins/docker_net /usr/lib/munin/plugins/docker_net
COPY plugins/docker_disk /usr/lib/munin/plugins/docker_disk

RUN chmod +x /usr/lib/munin/plugins/docker_* && \
    ln -sf /usr/lib/munin/plugins/docker_cpu /etc/munin/plugins/docker_cpu && \
    ln -sf /usr/lib/munin/plugins/docker_mem /etc/munin/plugins/docker_mem && \
    ln -sf /usr/lib/munin/plugins/docker_net /etc/munin/plugins/docker_net && \
    ln -sf /usr/lib/munin/plugins/docker_disk /etc/munin/plugins/docker_disk

RUN mkdir -p /etc/munin/plugin-conf.d && printf '[docker_*]\nuser root\n' > /etc/munin/plugin-conf.d/docker-plugins.conf

RUN echo "ServerName localhost" >> /etc/apache2/httpd.conf

VOLUME ["/var/lib/munin"]

EXPOSE 4948

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
