FROM node:current-alpine AS frontend-build
WORKDIR /work

# 1) Install deps (best cache hit)
COPY src/package.json src/package-lock.json ./src/
RUN cd src && npm ci

# 2) Copy sources + static HTML (build writes into nginx/html/app)
COPY src/ ./src/

RUN cd src && npm run build

FROM nginx:latest

COPY nginx/html/ ./nginx/html/

# copy nginx config
COPY nginx/conf.d/ /etc/nginx/conf.d/

# copy built html + assets
COPY --from=frontend-build /work/dist /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
