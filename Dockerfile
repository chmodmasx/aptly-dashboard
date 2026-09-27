FROM node:22-bookworm-slim AS frontend
WORKDIR /src

COPY package.json ./
RUN npm install

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts components.json ./
COPY src ./src
RUN npm run build

FROM rust:1-bookworm AS backend
WORKDIR /src
COPY backend ./backend
RUN cargo build --release --manifest-path backend/Cargo.toml

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home dashboard \
    && mkdir -p /app/dist /data /backups \
    && chown -R dashboard:dashboard /data /backups

COPY --from=backend /src/backend/target/release/aptly-dashboard-server /usr/local/bin/aptly-dashboard
COPY --from=frontend /src/dist /app/dist

ENV DASHBOARD_BIND=0.0.0.0:8080
ENV DASHBOARD_STATIC_DIR=/app/dist
ENV APTLY_URL=http://aptly:8080

EXPOSE 8080

VOLUME ["/data", "/backups"]

USER dashboard

ENTRYPOINT ["/usr/local/bin/aptly-dashboard"]
CMD ["dashboard"]
