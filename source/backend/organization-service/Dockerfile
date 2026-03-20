# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy parent pom
COPY pom.xml .

# Copy child poms
COPY identity-service/pom.xml identity-service/
COPY organization-service/pom.xml organization-service/
COPY leave-service/pom.xml leave-service/
COPY recruitment-service/pom.xml recruitment-service/

# Download dependencies (cache layer)
RUN mvn dependency:go-offline -B

# Copy all source
COPY . .

# Build only the organization-service module
RUN mvn -pl organization-service clean package -DskipTests -am

# Stage 2: Run with lightweight JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/organization-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
