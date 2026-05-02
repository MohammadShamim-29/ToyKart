# ToyKart MERN Ecommerce Boilerplate

A starter MERN stack boilerplate for ecommerce apps.

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Frontend: React + Vite, React Router, Redux Toolkit

## Project Structure

- `server/` Express API
- `client/` React frontend

## Prerequisites

- Node.js 20+ and npm
- MongoDB connection string (Atlas/local)

## Setup

```bash
nvm use
npm run install:all
cp server/.env.example server/.env
# update Mongo settings and JWT secret
npm run dev
```

Backend runs on `http://localhost:5000` and frontend on `http://localhost:5173`.
Make sure MongoDB is running before starting the backend.

## Docker Mongo Integration

If MongoDB is already running in Docker and mapped to your host, keep:

```env
MONGO_HOST=127.0.0.1
MONGO_PORT=27017
MONGO_DB=toykart
```

If your container uses auth, also set:

```env
MONGO_USER=your_user
MONGO_PASS=your_password
MONGO_AUTH_SOURCE=admin
```

You can also set a full `MONGO_URI`; when present it takes priority.

## Mongo Express (Web UI for Local MongoDB)

Use Mongo Express to browse and edit your local Docker MongoDB in a browser.

1. Create env file:

```bash
cp .env.mongo-express.example .env.mongo-express
```

2. If MongoDB uses auth, update `ME_CONFIG_MONGODB_URL` in `.env.mongo-express`, for example:

```env
ME_CONFIG_MONGODB_URL=mongodb://root:secret@host.docker.internal:27017/?authSource=admin
```

3. Start Mongo Express:

```bash
docker compose --env-file .env.mongo-express -f docker-compose.mongo-express.yml up -d
```

4. Open:

```text
http://localhost:8081
```

Default Mongo Express login is set by:

- `ME_CONFIG_BASICAUTH_USERNAME`
- `ME_CONFIG_BASICAUTH_PASSWORD`

Stop it with:

```bash
docker compose -f docker-compose.mongo-express.yml down
```

## Admin panel

After registering a user, grant admin access (from repo root):

```bash
npm run promote-admin --workspace server -- your@email.com
```

Then sign in and open `http://localhost:5173/admin` (or use the **Admin** link in the header).

Seed data assigns product categories in MongoDB; run `npm run seed --workspace server` if the catalog is empty or after a category schema change.

## API Starter Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders` (auth required)
- `GET /api/orders/my` (auth required)
- `GET /api/orders/:id` (auth + owner)
- `PATCH /api/orders/:id/cancel` (auth + owner)
- `GET|POST|PUT|DELETE /api/admin/categories` (JWT + admin)
- `GET|POST|PUT|DELETE /api/admin/products` (JWT + admin)
- `GET /api/admin/orders` (JWT + admin)
- `GET|PUT /api/admin/orders/:id` (JWT + admin)
- `PATCH /api/admin/orders/:id/status` (JWT + admin)
- `POST /api/admin/orders/:id/notes` (JWT + admin)
- `PATCH /api/admin/orders/:id/cancel` (JWT + admin)
- `PATCH /api/admin/orders/:id/refund` (JWT + admin)
