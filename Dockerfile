FROM gradle:8.14.3-jdk21 AS backend-build
WORKDIR /backend
COPY backend /backend

RUN gradle shadowJar

FROM oven/bun:latest AS frontend-build
WORKDIR /frontend
COPY frontend/web /frontend

ENV VITE_BASE_URL="https://umn.app/api"
ENV VITE_CDN_URL="https://cdn.umn.app"

RUN bun install
RUN bun run build

FROM oven/bun:latest AS admin-build
WORKDIR /admin
COPY frontend/admin /admin

ENV VITE_BASE_URL="https://umn.app/api"
ENV CI="true"

RUN bun install
RUN bun run build

FROM ubuntu:latest

WORKDIR /app

RUN apt-get -y update
RUN apt-get -y install openjdk-21-jdk
RUN apt-get -y install curl

COPY --from=backend-build /backend/build/libs/*.jar /app/app.jar
COPY --from=frontend-build /frontend/dist /app/frontend
COPY --from=admin-build /admin/dist /app/admin

CMD ["java", "-jar", "/app/app.jar"]