FROM node:13-slim AS ui-install
COPY ui/package.json /usr/app/ui/package.json
COPY ui/yarn.lock /usr/app/ui/yarn.lock
WORKDIR /usr/app/ui
RUN yarn install

FROM node:13-slim AS server-build
COPY server/package.json /usr/app/package.json
COPY server/yarn.lock /usr/app/yarn.lock
WORKDIR /usr/app
RUN yarn install

FROM node:13-slim AS ui-build
COPY ui /usr/app/ui
COPY --from=ui-install /usr/app/ui/node_modules /usr/app/ui/node_modules
WORKDIR /usr/app/ui
RUN yarn build

FROM node:13-slim
COPY --from=ui-build /usr/app/ui/build /usr/app/ui/build
COPY --from=server-build /usr/app/node_modules /usr/app/node_modules

COPY server/package.json /usr/app
COPY server/tsconfig.json /usr/app
COPY server/src /usr/app/src

WORKDIR /usr/app
CMD ["yarn", "start"]