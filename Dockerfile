FROM node:13-slim AS ui-install

COPY ui/package.json /usr/app/ui/package.json
WORKDIR /usr/app/ui
RUN yarn install

FROM node:13-slim AS server-build
COPY package.json /usr/app/package.json
WORKDIR /usr/app/src
RUN yarn install

FROM node:13-slim AS ui-build
COPY ui /usr/app/ui
COPY --from=ui-install /usr/app/ui/node_modules /usr/app/ui/node_modules
WORKDIR /usr/app/ui
RUN yarn build

FROM node:13-slim
COPY --from=ui-build /usr/app/ui/build /usr/app/ui/build
COPY --from=server-build /usr/app/node_modules /usr/app/node_modules

COPY package.json /usr/app
COPY tsconfig.json /usr/app
COPY src /usr/app/src

WORKDIR /usr/app
CMD ["yarn", "start"]