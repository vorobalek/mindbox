FROM node:current-alpine AS frontend-build
WORKDIR /work
COPY src/package.json src/package-lock.json ./src/
RUN cd src && npm ci
COPY src/ ./src/
RUN cd src && npm run build

FROM nginx:latest
COPY nginx/conf.d/ /etc/nginx/conf.d/
COPY nginx/html/ /usr/share/nginx/html/
COPY --from=frontend-build /work/dist /usr/share/nginx/html/
CMD ["nginx", "-g", "daemon off;"]
