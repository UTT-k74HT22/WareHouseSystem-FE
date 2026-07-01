FROM node:20-alpine AS build
WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist/whs-fe /usr/share/nginx/html
COPY src/assets/env.template.js /etc/nginx/templates/env.template.js

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/templates/env.template.js > /usr/share/nginx/html/assets/env.js && nginx -g 'daemon off;'"]
