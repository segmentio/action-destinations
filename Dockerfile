FROM node:18

RUN mkdir /app

COPY --from=datadog/serverless-init:1 /datadog-init /app/datadog-init
COPY --from=datadog/dd-lib-js-init /operator-build/node_modules /dd_tracer/node/
ENV DD_VERSION=1

COPY package.json /app/
WORKDIR /app
COPY . ./

RUN yarn install
RUN yarn run build
EXPOSE 3000
ENTRYPOINT ["/app/datadog-init"]
#CMD ["yarn", "start"]
CMD ["./bin/run", "serve", "-d", "spiffy"]
