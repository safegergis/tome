# Tome

A microservices-based book management platform built with Spring Boot and PostgreSQL.

## Architecture

This project consists of:
- **tome-users**: A Spring Boot microservice for user management
- **PostgreSQL Database**: Data persistence layer
- **Docker Compose**: Container orchestration for local development

### Planned Architecture

- **tome-books**: Microservice for book data management
- **tome-social**: Microservice for social features (reviews, ratings, recommendations)
- **React Native Mobile App**: Cross-platform mobile frontend

## Technologies

### Backend
- Java 24
- Spring Boot 3.5.5
- Spring Data JPA
- PostgreSQL
- Docker & Docker Compose
- Maven

### Frontend (Planned)
- React Native
- TypeScript/JavaScript

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Java 24 (if running locally without Docker)
- Maven (if building locally)

### Running with Docker

1. Clone the repository
2. Navigate to the project directory
3. Start the services:
   ```bash
   cd tome-backend
   docker-compose up -d
   ```

This will start:
- PostgreSQL database on port 5432
- tome-users service on port 8080

### Local Development

To run the tome-users service locally:

```bash
cd tome-backend/tome-users
./mvnw spring-boot:run
```

Make sure PostgreSQL is running and accessible with the credentials specified in `docker-compose.yaml`.

## Database Configuration

The application connects to PostgreSQL with the following default configuration:
- Database: `tomedb`
- Username: `myuser`
- Password: `secret`
- Port: `5432`

## API Endpoints

The tome-users service exposes REST endpoints on port 8080. (Specific endpoints depend on the implemented controllers)

## Project Structure

```
tome/
├── tome-backend/
│   ├── docker-compose.yaml
│   └── tome-users/
│       ├── src/
│       ├── pom.xml
│       ├── Dockerfile
│       └── ...
└── README.md
```