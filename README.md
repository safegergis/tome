# Tome

A social book tracking application built with React Native and Spring Boot microservices. Track your reading, organize books with custom lists, connect with friends, and analyze your reading habits.

## Features

### Core Functionality
- **User Authentication**: Secure registration and login with email verification
- **Book Catalog**: Browse and search books with detailed information including authors and genres
- **Personal Library**: Track books across three shelves (Want to Read, Currently Reading, Read)
- **Custom Lists**: Create and manage themed book lists with drag-and-drop reordering
- **Reading Sessions**: Log reading sessions with support for physical books, e-books, and audiobooks
- **Statistics & Analytics**: Comprehensive reading statistics including:
  - Time series data and completion trends
  - Genre and author breakdowns
  - Reading method analysis
  - Reading streaks and goals

### Social Features
- **Friends**: Connect with other readers
- **Friend Requests**: Send and receive friend requests
- **Activity Feed**: View friends' reading activity and updates
- **User Profiles**: Browse other users' reading profiles

## Architecture

The application uses a microservices architecture with three Spring Boot services and a React Native mobile frontend.

### Backend Services

#### tome-auth (Port 8082)
User authentication and management service
- User registration and login
- Email verification
- JWT-based authentication
- User profile management

#### tome-content (Port 8080)
Book catalog and metadata service
- Book information and search
- Author management
- Genre classification

#### tome-user-data (Port 8083)
User-specific data and social features
- User book tracking and shelves
- Custom list management
- Reading session logging
- Reading statistics and analytics
- Friendship management
- Activity feed generation

### Frontend

React Native mobile application built with Expo
- Cross-platform (iOS, Android, Web)
- File-based routing with Expo Router
- TypeScript for type safety
- Custom UI components with eggshell and purple theme

## Technologies

### Backend
- **Java 24**
- **Spring Boot 3.5.7**
- **Spring Data JPA** - Database abstraction
- **Spring Security** - Authentication and authorization
- **Spring Mail** - Email verification
- **PostgreSQL** - Data persistence
- **Docker & Docker Compose** - Containerization
- **Maven** - Build management

### Frontend
- **React Native 0.81.4** - Mobile framework
- **Expo ~54.0** - Development platform
- **React 19.1.0** - UI library
- **TypeScript 5.9** - Type safety
- **Expo Router 6.0** - File-based navigation
- **Victory Native** - Data visualization
- **React Native Gesture Handler** - Touch interactions
- **React Native Reanimated** - Smooth animations

## Getting Started

### Prerequisites

- **Docker and Docker Compose** (for containerized deployment)
- **Java 24** (for local backend development)
- **Maven** (usually included with Java installation)
- **Node.js 18+** (for frontend development)
- **pnpm** (Node package manager - install with `npm install -g pnpm`)
- **PostgreSQL 15+** (for local database - not needed if using Docker)
- **Git** (for version control)

### Full Project Setup from Scratch

Follow these steps to recreate the entire project on your own system:

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd tome
```

#### 2. Database Setup

You need a PostgreSQL 15+ database. **The application is database-agnostic** - it works with any PostgreSQL deployment:
- ✅ Managed database services (DigitalOcean, AWS RDS, Azure Database, Heroku, etc.)
- ✅ Local PostgreSQL installation
- ✅ PostgreSQL in Docker
- ✅ Cloud-hosted PostgreSQL
- ✅ Any other PostgreSQL 15+ instance

**Initialize the Schema:**

Once you have a PostgreSQL database available, initialize the schema using the provided `init.sql` script:

```bash
# If you have direct psql access:
psql -h <hostname> -U <username> -d <database> -f tome-backend/init.sql

# Example with local database:
psql -U myuser -d tomedb -f tome-backend/init.sql

# Example with remote managed database:
psql -h db.example.com -p 25060 -U dbuser -d production -f tome-backend/init.sql
```

**What the init.sql script does:**
- Creates all ENUM types (reading_status, reading_method, list_type, friend_request_status)
- Creates all tables with proper constraints and indexes
- Creates database views for analytics
- Sets up triggers for automatic timestamp updates
- Creates default lists for new users automatically
- Seeds initial genre data

**Note:** If using a managed database service, you may need to use their web console, CLI tool, or SQL client to run the initialization script.

#### 3. Environment Configuration

1. Copy the example environment file:

```bash
cd tome-backend
cp .env.example .env
```

2. Edit `.env` and configure:
   - **Database credentials**: Update `DB_URL`, `DB_USER`, and `DB_PASSWORD` to match your PostgreSQL database
   - **Mail server settings**: Configure for email verification (Gmail example provided)
   - **JWT secret**: Generate a secure key with `openssl rand -hex 32`
   - **Service URLs**: Set based on your deployment (container names for Docker, localhost for local development)

**Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

#### 4. Backend Setup

**Prerequisites:**
- PostgreSQL database is running and initialized (step 2)
- Environment variables configured in `.env` file (step 3)

##### Using Docker (Recommended)

Start all services with Docker Compose:

```bash
cd tome-backend
docker-compose up -d
```

This starts:
- tome-auth on port 8082
- tome-content on port 8080
- tome-user-data on port 8083

**Note:** The services will connect to whatever database is configured in your `.env` file (managed, local, or Docker).

Verify services are running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs -f
```

##### Local Development (Without Docker)

1. Ensure PostgreSQL database is accessible and initialized
2. Verify `.env` file has correct database connection details
3. Start each service:

```bash
# Terminal 1 - Auth service
cd tome-backend/tome-auth
./mvnw clean install
./mvnw spring-boot:run

# Terminal 2 - Content service
cd tome-backend/tome-content
./mvnw clean install
./mvnw spring-boot:run

# Terminal 3 - User data service
cd tome-backend/tome-user-data
./mvnw clean install
./mvnw spring-boot:run
```

#### 5. Frontend Setup

1. Navigate to the frontend directory:

```bash
cd tome-frontend/tome
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm start
```

4. Run on specific platforms:

```bash
pnpm ios      # iOS simulator (requires Xcode on macOS)
pnpm android  # Android emulator (requires Android Studio)
pnpm web      # Web browser (easiest for development)
```

#### 6. Verify Installation

1. Check backend health endpoints:
   - Auth service: http://localhost:8082/actuator/health
   - Content service: http://localhost:8080/actuator/health
   - User data service: http://localhost:8083/actuator/health

2. Access the frontend:
   - Web: http://localhost:8081 (or port shown in terminal)
   - Mobile: Scan QR code with Expo Go app

3. Test user registration:
   - Create a new account through the app
   - Verify email verification (check console logs for verification code)

### Quick Start Scripts (Optional)

Create these helper scripts for convenience:

**start-backend.sh:**
```bash
#!/bin/bash
cd tome-backend
docker-compose up -d
echo "Backend services starting..."
echo "Auth: http://localhost:8082"
echo "Content: http://localhost:8080"
echo "User Data: http://localhost:8083"
```

**start-frontend.sh:**
```bash
#!/bin/bash
cd tome-frontend/tome
pnpm start
```

**stop-backend.sh:**
```bash
#!/bin/bash
cd tome-backend
docker-compose down
echo "Backend services stopped"
```

Make them executable:
```bash
chmod +x start-backend.sh start-frontend.sh stop-backend.sh
```

**Note:** If you're using a managed database service, you don't need database start/stop scripts. If you're using Docker for PostgreSQL locally, you can create your own script following your specific setup.

## Database Configuration

PostgreSQL connection settings are configured via environment variables in the `.env` file.

### Required Environment Variables

Set these in your `tome-backend/.env` file:

```bash
# Full JDBC connection URL
DB_URL=jdbc:postgresql://<host>:<port>/<database>?<options>

# Database credentials
DB_USER=<username>
DB_PASSWORD=<password>
```

### Connection String Examples

**Local Database:**
```bash
DB_URL=jdbc:postgresql://localhost:5432/tomedb
DB_USER=myuser
DB_PASSWORD=secret
```

**Managed Database (with SSL):**
```bash
DB_URL=jdbc:postgresql://db-host.example.com:25060/production?sslmode=require
DB_USER=dbadmin
DB_PASSWORD=your-secure-password
```

**Docker Network:**
```bash
DB_URL=jdbc:postgresql://postgres:5432/tomedb
DB_USER=myuser
DB_PASSWORD=secret
```

### Database Schema

The database schema is defined in `tome-backend/init.sql` and includes:
- User authentication and verification
- Book catalog with authors and genres
- User book tracking and shelves
- Reading sessions and statistics
- Social features (friendships, friend requests)
- Custom lists with drag-and-drop ordering

For detailed schema documentation, see `DATABASE_SCHEMA.md`.

### Resetting the Database

To completely reset the database, drop and recreate it, then run the init.sql script:

**Using psql (works for any PostgreSQL):**
```bash
# Connect as superuser and recreate database
psql -h <host> -U postgres -c "DROP DATABASE <dbname>;"
psql -h <host> -U postgres -c "CREATE DATABASE <dbname>;"
psql -h <host> -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE <dbname> TO <username>;"

# Reinitialize schema
psql -h <host> -U <username> -d <dbname> -f tome-backend/init.sql
```

**Local example:**
```bash
psql -U postgres -c "DROP DATABASE tomedb;"
psql -U postgres -c "CREATE DATABASE tomedb;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE tomedb TO myuser;"
psql -U myuser -d tomedb -f tome-backend/init.sql
```

**For managed databases:**
- Use your database provider's console/dashboard to drop and recreate the database
- Or use their CLI tools (e.g., `doctl databases` for DigitalOcean)
- Then run the init.sql script using their connection string

## API Endpoints

### Authentication Service (8082)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Email verification
- `GET /api/users/profile` - Get user profile

### Content Service (8080)
- `GET /api/books` - Search and browse books
- `GET /api/books/{id}` - Get book details
- `GET /api/authors` - Browse authors
- `GET /api/genres` - Get genres

### User Data Service (8083)
- `GET /api/user-books` - Get user's books
- `POST /api/user-books` - Add book to shelf
- `GET /api/lists` - Get user's lists
- `POST /api/lists` - Create new list
- `GET /api/reading-sessions` - Get reading sessions
- `POST /api/reading-sessions` - Log reading session
- `GET /api/statistics` - Get reading statistics
- `GET /api/friendships` - Manage friendships
- `GET /api/activity-feed` - Get activity feed

## Project Structure

```
tome/
├── tome-backend/
│   ├── docker-compose.yaml
│   ├── tome-auth/           # Authentication service
│   ├── tome-content/        # Book catalog service
│   └── tome-user-data/      # User data & social service
└── tome-frontend/
    └── tome/                # React Native app
        ├── app/             # Expo Router screens
        ├── components/      # Reusable components
        ├── services/        # API clients
        └── types/           # TypeScript types
```

## Development

### Frontend
- **Package Manager**: Use `pnpm` (not npm or yarn)
- **Linting**: Run `pnpm lint` before committing
- **Design System**: Eggshell white (#F5F5DC) and purple (#6B46C1) theme

### Backend
- **Build**: `./mvnw clean package`
- **Tests**: `./mvnw test`
- **Code Style**: Follow Spring Boot best practices

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** Services can't connect to PostgreSQL

**Solutions:**
1. Verify database credentials in `.env` file:
```bash
cat tome-backend/.env | grep DB_
```

2. Test database connection manually:
```bash
# Using psql
psql -h <hostname> -U <username> -d <database> -c "SELECT 1"

# Example with local database:
psql -U myuser -d tomedb -c "SELECT 1"

# Example with remote database:
psql -h db.example.com -p 25060 -U dbuser -d production -c "SELECT 1"
```

3. Common issues:
   - **Firewall**: Ensure your database allows connections from your IP
   - **SSL mode**: Managed databases often require `?sslmode=require` in the connection URL
   - **Host**: Use correct hostname (not `localhost` if database is remote)
   - **Port**: Default is 5432, but managed databases may use different ports
   - **Credentials**: Verify username and password are correct

#### Port Already in Use

**Problem:** Error "port is already allocated"

**Solutions:**
```bash
# Check what's using the port (e.g., 8080)
lsof -i :8080

# Kill the process or use different ports in docker-compose.yaml
# Edit docker-compose.yaml and change the port mapping:
# ports:
#   - "8081:8080"  # Maps host 8081 to container 8080
```

#### Services Won't Start

**Problem:** Backend services fail to start

**Solutions:**
```bash
# Check logs for specific service
docker-compose logs auth
docker-compose logs content
docker-compose logs user-data

# Rebuild services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check if .env file exists and is configured
cat tome-backend/.env
```

#### Schema Not Initialized

**Problem:** Tables don't exist in database

**Solutions:**

Run the initialization script:
```bash
# General format
psql -h <hostname> -U <username> -d <database> -f tome-backend/init.sql

# Local database example:
psql -U myuser -d tomedb -f tome-backend/init.sql

# Remote/managed database example:
psql -h db.example.com -p 25060 -U dbuser -d production -f tome-backend/init.sql
```

Verify tables were created:
```bash
# Check tables
psql -h <hostname> -U <username> -d <database> -c "\dt"

# Check enums
psql -h <hostname> -U <username> -d <database> -c "\dT"

# Check views
psql -h <hostname> -U <username> -d <database> -c "\dv"
```

#### Frontend Won't Connect to Backend

**Problem:** API calls failing from frontend

**Solutions:**
```bash
# Verify backend is running
curl http://localhost:8082/actuator/health
curl http://localhost:8080/actuator/health
curl http://localhost:8083/actuator/health

# Check backend logs for errors
docker-compose logs -f

# Verify service URLs in frontend code
# Check tome-frontend/tome/services/*.service.ts files
```

#### Email Verification Not Working

**Problem:** Verification emails not sending

**Solutions:**
1. Check mail configuration in `.env`:
   - Verify MAIL_USERNAME and MAIL_PASSWORD are correct
   - For Gmail, use an App Password (not your regular password)
   - Enable "Less secure app access" if needed

2. Check logs for mail errors:
```bash
docker-compose logs auth | grep -i mail
```

3. For development, check console logs for verification code instead of email

#### Maven Build Failures

**Problem:** `./mvnw clean install` fails

**Solutions:**
```bash
# Ensure Java 24 is installed
java -version

# Clear Maven cache
rm -rf ~/.m2/repository

# Try with Maven wrapper
cd tome-backend/tome-auth
./mvnw clean install -U

# If wrapper fails, use system Maven
mvn clean install
```

#### pnpm Install Failures

**Problem:** `pnpm install` fails in frontend

**Solutions:**
```bash
# Clear pnpm cache
pnpm store prune

# Delete node_modules and lockfile
rm -rf node_modules pnpm-lock.yaml

# Reinstall
pnpm install

# If still failing, try with legacy peer deps
pnpm install --legacy-peer-deps
```

### Getting Help

1. Check service logs: `docker-compose logs [service-name]`
2. Verify environment variables are set correctly in `.env`
3. Ensure all required ports are available (8080, 8082, 8083 for backend; 8081 for frontend)
4. Check database is accessible and schema is initialized:
   ```bash
   psql -h <hostname> -U <username> -d <database> -c "\dt"
   ```
5. Verify JPA entities match database schema (compare with `init.sql`)
6. For managed databases, check provider's dashboard for connection issues

### Useful Commands

**Backend Services:**
```bash
# View all running containers
docker-compose ps

# Restart a specific service
docker-compose restart auth

# View real-time logs
docker-compose logs -f --tail=100

# Rebuild and restart backend services
docker-compose down && docker-compose build && docker-compose up -d
```

**Database Management:**
```bash
# Connect to database (replace with your connection details)
psql -h <hostname> -U <username> -d <database>

# List all tables
psql -h <hostname> -U <username> -d <database> -c "\dt"

# List all enums
psql -h <hostname> -U <username> -d <database> -c "\dT"

# List all views
psql -h <hostname> -U <username> -d <database> -c "\dv"

# Count records in a table
psql -h <hostname> -U <username> -d <database> -c "SELECT COUNT(*) FROM users;"

# Check database size
psql -h <hostname> -U <username> -d <database> -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

**Local Database Examples:**
```bash
psql -U myuser -d tomedb -c "\dt"  # List tables
psql -U myuser -d tomedb -c "\dT"  # List enums
psql -U myuser -d tomedb -c "\dv"  # List views
```

## License

This project is private and not licensed for public use.
