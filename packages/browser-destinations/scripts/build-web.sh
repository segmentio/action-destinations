#!/bin/bash
NODE_VERSION="$(node --version)";
NODE_VERSION_MAJOR="${NODE_VERSION:1}"; # strip the "v"  prefix
NODE_VERSION_MAJOR="${NODE_VERSION_MAJOR%%.*}"; #get everything before the first dot
if [ "$NODE_VERSION_MAJOR" -ge "18" ]; then
NODE_ENV=production ASSET_ENV=production NODE_OPTIONS=--openssl-legacy-provider yarn webpack -c webpack.config.js
else NODE_ENV=production ASSET_ENV=production yarn webpack -c webpack.config.js
fi
