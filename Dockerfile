FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk add --no-cache gettext

COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template
COPY deploy/docker-entrypoint.d/40-envsubst-runtime-config.sh /docker-entrypoint.d/40-envsubst-runtime-config.sh
COPY --from=build /app/dist/whs-fe /usr/share/nginx/html
COPY src/runtime-config.template.js /usr/share/nginx/html/assets/runtime-config.template.js

RUN sed -i 's/\r$//' /docker-entrypoint.d/40-envsubst-runtime-config.sh \
    && chmod +x /docker-entrypoint.d/40-envsubst-runtime-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -q --spider http://127.0.0.1/healthz || exit 1
