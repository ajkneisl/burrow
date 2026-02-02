FROM gradle:8.14.3-jdk21 AS backend-build
WORKDIR /backend
COPY backend /backend

RUN gradle shadowJar

FROM node:latest AS frontend-build
WORKDIR /frontend
COPY frontend/web /frontend

ENV VITE_BASE_URL="https://umn.app/api"
ENV VITE_CDN_URL="https://cdn.umn.app"

RUN npm install --force
RUN npm run build

FROM node:lts AS admin-build

# Enable corepack to manage pnpm
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /admin
COPY frontend/admin /admin

ENV VITE_BASE_URL="https://umn.app/api"
ENV CI="true"

RUN pnpm install --no-frozen-lockfile
RUN pnpm run build

FROM ubuntu:latest

WORKDIR /app

RUN apt-get -y update
RUN apt-get -y install openjdk-21-jdk
RUN apt-get -y install curl

COPY --from=backend-build /backend/build/libs/*.jar /app/app.jar
COPY --from=frontend-build /frontend/dist /app/frontend
COPY --from=admin-build /admin/dist /app/admin

CMD ["java", "-jar", "/app/app.jar"]