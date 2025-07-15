# Nilanjan Mitra's Submission

## 🚀 Deployed Application Links

- **Frontend (Vercel):** [Deployed Frontend](https://intern-assignment-lemon.vercel.app/)
- **Backend (Render):** [Deployed Backend](https://intern-assignment-api.onrender.com)
- **Postman Workspace:** [Workspace Link](https://app.getpostman.com/join-team?invite_code=36036a73f061cd8070a859fc1abad9c7c48da7072ed13c666e9075beb55ce7b0&target_code=db6c903709a87f1e94a85c5e574ab22c)

## Project Overview

A modern, full-stack application for managing personal notes and bookmarks. Features include:

- Save, search, and filter notes with tags and markdown support
- Save bookmarks with URL, title, and description (auto-fetches metadata)
- Auto-fetch bookmark title/description from URL using OpenGraph
- User authentication (JWT, cookies)
- OTP authentication and forgot password
- File uploads within notes
- Favorite Notes and Bookmarks
- Responsive and clean UI

## Tech Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Frontend:** Next.js (React), Tailwind CSS, shadcn/ui, Framer Motion
- **Other:** JWT Auth, Cloudinary (file uploads), Open Graph Scraper (bookmark metadata)

## Setup Instructions

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- Node.js (for some dev tools)
- MongoDB Atlas or local MongoDB instance
- (Optional) Cloudinary account for file uploads

### 1. Clone the Repository

```sh
git clone <repo-url>
cd intern-assignment
```

### 2. Backend Setup

```sh
cd backend
bun install
# Copy and edit .env
cp .env.example .env
# Build and start (dev mode)
bun run dev
# Or build for production
bun run build && bun run start
```

#### Sample .env (backend/.env.example)

```
NODE_ENV=development
PORT=8000
GMAIL_USER="your_email@gmail.com"
GOOGLE_APP_PASSWORD="your_google_app_password"
JWT_SECRET=your_jwt_secret
SITE_URL=https://your-site-url.com

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
MONGODB_HOST=your_mongodb_connection_string

MONGODB_ATLAS_PROJECT_ID=your_mongodb_atlas_project_id
MONGODB_ATLAS_CLUSTER=your_mongodb_atlas_cluster
MONGODB_ATLAS_PUBLIC_KEY=your_mongodb_atlas_public_key
MONGODB_ATLAS_PRIAVTE_KEY=your_mongodb_atlas_private_key
MONGODB_ATLAS_SERVICE_ACC_CLIENT_ID=your_mongodb_atlas_service_account_client_id
MONGODB_ATLAS_SERVICE_ACC_CLIENT_SECRET=your_mongodb_atlas_service_account_client_secret
```

### 3. Frontend Setup

```sh
cd ../frontend
bun install
# Copy and edit .env
cp .env.example .env
# Start dev server
bun run dev
```

#### Sample .env (frontend/.env.example)

```
# API root for backend
API_URL=https://your-backend-url.com
```

## API Documentation (Backend)

### Notes API

- `POST   /api/notes` — Create note
- `GET    /api/notes` — List/search notes (`?q=searchTerm&tags=tag1,tag2`)
- `GET    /api/notes/:id` — Get note by ID
- `PUT    /api/notes/:id` — Update note
- `DELETE /api/notes/:id` — Delete note

### Bookmarks API

- `POST   /api/bookmarks` — Create bookmark
- `GET    /api/bookmarks` — List/search bookmarks (`?q=searchTerm&tags=tag1,tag2`)
- `GET    /api/bookmarks/:id` — Get bookmark by ID
- `PUT    /api/bookmarks/:id` — Update bookmark
- `DELETE /api/bookmarks/:id` — Delete bookmark

### Auth API

- `POST   /api/auth/register` — Register
- `POST   /api/auth/login` — Login (email/password)
- `POST   /api/auth/gen-otp` — Request OTP
- `POST   /api/auth/otp-login` — Login with OTP
- `POST   /api/auth/logout` — Logout
- `GET    /api/auth/me` — Get current user

### General

- All endpoints require authentication except `/api/auth/*` and `/api/health`
- Use JWT cookies for authentication
- Proper HTTP status codes and error messages

## Folder Structure

- `backend/` — Express API, models, controllers, middleware, utils
- `frontend/` — Next.js app, pages, components, lib

## License

GNU GPLv3
