#!/bin/sh
date +%s.%N
echo "fetch docker_cpu" | nc localhost 4949
date +%s.%N
