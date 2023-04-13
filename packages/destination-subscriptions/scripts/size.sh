#!/bin/bash
NODE_VERSION="$(node --version)";
NODE_VERSION_MAJOR="${NODE_VERSION:1}"; # strip the "v"  prefix
NODE_VERSION_MAJOR="${NODE_VERSION_MAJOR%%.*}"; #get everything before the first dot
if [ "$NODE_VERSION_MAJOR" -ge "18" ]; then
NODE_OPTIONS=--openssl-legacy-provider size-limit
else size-limit
fi
