FROM eclipse-temurin:21-jdk AS build
ARG SERVICE
WORKDIR /workspace
COPY . .
RUN chmod +x mvnw && ./mvnw --batch-mode --no-transfer-progress -pl "backend/$SERVICE" -am -DskipTests package && cp backend/"$SERVICE"/target/*.jar /workspace/app.jar

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
USER spring
WORKDIR /app
COPY --from=build /workspace/app.jar app.jar
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
