# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy parent pom first
COPY pom.xml .

# Copy child poms
COPY identity-service/pom.xml identity-service/
COPY organization-service/pom.xml organization-service/
COPY leave-service/pom.xml leave-service/
COPY recruitment-service/pom.xml recruitment-service/

# Copy all source before dependencies
COPY . .

# Build only the recruitment-service module (with dependencies)
RUN mvn -pl recruitment-service clean package -DskipTests -am

# Stage 2: Run with the same base image to avoid extra registry pulls
FROM maven:3.9.6-eclipse-temurin-17
WORKDIR /app
COPY --from=build /app/recruitment-service/target/*.jar app.jar

# Create uploads directory for CV files
RUN mkdir -p /app/uploads

EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
