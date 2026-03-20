# TextChat — Real-Time Chat Application

A full-stack real-time chat application built with a monorepo architecture containing three services:

| Service      | Tech Stack                  | Port   |
| ------------ | --------------------------- | ------ |
| **Backend**  | Express, TypeScript, Node   | `3001` |
| **WebSocket**| ws, JWT, TypeScript, Node   | `3002` |
| **Frontend** | Next.js 16, React 19, TypeScript | `3000` |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20+ recommended)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+ recommended)
- [Node.js](https://nodejs.org/) v20+ _(only for local development without Docker)_
- [npm](https://www.npmjs.com/) _(comes with Node.js)_

---

## Project Structure

```
textchatbe/
├── docker-compose.yml          # Orchestrates all services
├── dockerfile/
│   ├── Dockerfile.backend      # Backend service image
│   ├── Dockerfile.frontend     # Frontend service image
│   └── Dockerfile.webSocket    # WebSocket service image
├── http/                       # Backend service (Express)
│   ├── src/
│   ├── package.json
│   └── .backend.env
├── ws/                         # WebSocket service
│   ├── src/
│   ├── package.json
│   └── .socket.env
└── frontend/                   # Frontend service (Next.js)
    ├── app/
    ├── package.json
    └── .frontend.env
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd textchatbe
```

### 2. Configure Environment Variables

Each service requires its own `.env` file. Create them using the examples below:

**Backend** — `http/.backend.env`
```env
# Add your backend environment variables
PORT=3001
```

**WebSocket** — `ws/.socket.env`
```env
# Add your WebSocket environment variables
PORT=3002
```

**Frontend** — `frontend/.frontend.env`
```env
# Add your frontend environment variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

> **Note:** Adjust the variables based on your actual configuration. Check the existing `.env` files in each service directory for reference.

---

## Running with Docker Compose

### Build & Start All Services

```bash
docker compose up --build
```

This will build and start all three services:
- **Frontend** → [http://localhost:3000](http://localhost:3000)
- **Backend API** → [http://localhost:3001](http://localhost:3001)
- **WebSocket** → `ws://localhost:3002`

### Start in Detached Mode (Background)

```bash
docker compose up --build -d
```

### Stop All Services

```bash
docker compose down
```

### Rebuild a Specific Service

```bash
docker compose up --build <service-name>
```

Where `<service-name>` is one of: `web`, `socket`, `frontend`

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f web
docker compose logs -f socket
```
added reame file

### Restart a Single Service
```bash
docker compose restart <service-name>
```

---

## Local Development (Without Docker)

If you prefer running services directly on your machine:

### 1. Install Dependencies

```bash
# Backend
cd http && npm install && cd ..

# WebSocket
cd ws && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Start Each Service

Open three separate terminals and run:

**Terminal 1 — Backend (port 3001)**
```bash
cd http
npm run dev
```

**Terminal 2 — WebSocket (port 3002)**
```bash
cd ws
npm run dev
```

**Terminal 3 — Frontend (port 3000)**
```bash
cd frontend
npm run dev
```

---

## Useful Docker Commands

| Command                              | Description                              |
| ------------------------------------ | ---------------------------------------- |
| `docker compose up --build`          | Build & start all services               |
| `docker compose up --build -d`       | Build & start in background              |
| `docker compose down`                | Stop & remove all containers             |
| `docker compose down -v`             | Stop & remove containers + volumes       |
| `docker compose ps`                  | List running containers                  |
| `docker compose logs -f`             | Follow logs for all services             |
| `docker compose restart <service>`   | Restart a specific service               |
| `docker compose build <service>`     | Rebuild a specific service image         |
| `docker compose exec <service> sh`   | Open shell inside a running container    |

---

## License

ISC
