# User Management Application

A full-stack user management application built with **Angular 21** (frontend) and **Spring Boot 3.4** (backend) with **Oracle Database** support.

## Features

- **User Registration Form** with validation for name, email, date of birth, country, state, city, and address
- **Cascading Dropdowns** — Country → State → City selection with dynamic data loading
- **User Report** — Tabular view of all registered users with edit and delete functionality
- **Charts & Analytics** — Visual graphs showing user distribution by country (bar chart), state (pie chart), and city (doughnut chart)
- **Oracle Database** integration with H2 fallback for development

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Angular 21, Chart.js, ng2-charts    |
| Backend    | Spring Boot 3.4, Spring Data JPA    |
| Database   | Oracle Database (H2 for dev)        |
| Build      | Maven (backend), npm (frontend)     |

## Project Structure

```
user-management-app/
├── frontend/                    # Angular 21 application
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── user-form/       # Registration/edit form with cascading dropdowns
│   │   │   ├── user-list/       # User report table with edit/delete
│   │   │   └── user-charts/     # Bar, pie, and doughnut charts
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # HTTP services for API communication
│   └── ...
├── backend/                     # Spring Boot application
│   ├── src/main/java/.../
│   │   ├── controller/          # REST API controllers
│   │   ├── model/               # JPA entities (User, Country, State, City)
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── service/             # Business logic layer
│   │   ├── config/              # CORS, Jackson, and exception handling config
│   │   └── data/                # Database seeder for location data
│   └── src/main/resources/
│       ├── application.properties         # H2 config (default)
│       └── application-oracle.properties  # Oracle DB config
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 22+ and **npm** 10+
- **Java** 17+ (JDK)
- **Maven** 3.6+
- **Oracle Database** (optional — H2 is used by default for development)

### Backend Setup

```bash
cd backend

# Run with H2 (default - no Oracle needed)
mvn spring-boot:run

# Run with Oracle Database
mvn spring-boot:run -Dspring-boot.run.profiles=oracle
```

The backend API starts at `http://localhost:8080`.

### Frontend Setup

```bash
cd frontend
npm install
ng serve
```

The frontend starts at `http://localhost:4200`.

### Oracle Database Configuration

To use Oracle instead of H2, update `backend/src/main/resources/application-oracle.properties`:

```properties
spring.datasource.url=jdbc:oracle:thin:@<host>:<port>:<sid>
spring.datasource.username=<your-username>
spring.datasource.password=<your-password>
```

Then start the backend with the `oracle` profile:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=oracle
```

## API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/users`                    | Get all users                  |
| GET    | `/api/users/{id}`               | Get user by ID                 |
| POST   | `/api/users`                    | Create new user                |
| PUT    | `/api/users/{id}`               | Update user                    |
| DELETE | `/api/users/{id}`               | Delete user                    |
| GET    | `/api/users/stats/country`      | User count by country          |
| GET    | `/api/users/stats/state`        | User count by state            |
| GET    | `/api/users/stats/city`         | User count by city             |
| GET    | `/api/locations/countries`      | Get all countries              |
| GET    | `/api/locations/states/{id}`    | Get states by country          |
| GET    | `/api/locations/cities/{id}`    | Get cities by state            |
