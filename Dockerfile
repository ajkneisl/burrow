FROM gradle:8.14.3-jdk21 AS backend-build
WORKDIR /backend
COPY backend /backend

RUN gradle shadowJar

FROM oven/bun:latest AS frontend-build
WORKDIR /frontend
COPY frontend/web /frontend

RUN apt-get -y update && apt-get -y install --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

ARG BWS_ORG_ID
ARG BWS_PROJECT_ID
ARG BWS_TOKEN

RUN bun install
RUN bun run build

FROM oven/bun:latest AS admin-build
WORKDIR /admin
COPY frontend/admin /admin

RUN apt-get -y update && apt-get -y install --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

ARG BWS_ORG_ID
ARG BWS_PROJECT_ID
ARG BWS_TOKEN
ENV CI=true

RUN bun install
RUN bun run build

FROM ubuntu:latest

WORKDIR /app

RUN apt-get -y update
RUN apt-get -y install openjdk-21-jdk
RUN apt-get -y install curl

ARG BWS_VERSION=2.1.0
RUN apt-get -y install --no-install-recommends ca-certificates unzip \
    && arch="$(dpkg --print-architecture)" \
    && case "$arch" in \
         amd64) target="x86_64-unknown-linux-gnu" ;; \
         arm64) target="aarch64-unknown-linux-gnu" ;; \
         *) echo "unsupported architecture: $arch" >&2 && exit 1 ;; \
       esac \
    && curl -fsSL -o /tmp/bws.zip \
         "https://github.com/bitwarden/sdk-sm/releases/download/bws-v${BWS_VERSION}/bws-${target}-${BWS_VERSION}.zip" \
    && unzip /tmp/bws.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/bws \
    && rm /tmp/bws.zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /backend/build/libs/*.jar /app/app.jar
COPY --from=frontend-build /frontend/dist /app/frontend
COPY --from=admin-build /admin/dist /app/admin

CMD ["java", "-jar", "/app/app.jar"]