#
# Multi-stage build:
# - build React+TS frontend from `src/frontend`
# - serve static HTML + built artifacts via nginx
#

FROM node:current-alpine AS frontend-build
WORKDIR /work

# 1) Install deps (best cache hit)
COPY src/package.json src/frontend/package-lock.json ./src/frontend/
RUN cd src/frontend && npm ci

# 2) Copy sources + static HTML (build writes into nginx/html/app)
COPY src/frontend/ ./src/frontend/
COPY nginx/html/ ./nginx/html/

RUN cd src/frontend && npm run build

FROM nginx:latest

# copy nginx config
COPY nginx/conf.d/ /etc/nginx/conf.d/

# copy built html + assets
COPY --from=frontend-build /work/dist /usr/share/nginx/html/

CMD ["nginx", "-g", "daemon off;"]
