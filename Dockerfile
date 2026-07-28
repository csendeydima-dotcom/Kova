FROM node:24-alpine AS frontend-build
WORKDIR /workspace/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM maven:3.9.11-eclipse-temurin-21-alpine AS backend-build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
COPY backend/ backend/
COPY --from=frontend-build /workspace/frontend/dist/ backend/src/main/resources/static/
RUN --mount=type=cache,target=/root/.m2 mvn -f backend/pom.xml -B clean package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S kova && adduser -S kova -G kova
WORKDIR /app
COPY --from=backend-build /workspace/backend/target/kova-api-1.0.0.jar app.jar
USER kova
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
