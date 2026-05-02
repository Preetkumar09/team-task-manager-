# ⬡ TaskFlow — Team Task Manager

A full-stack web app for managing projects, assigning tasks, and tracking progress with role-based access control.

## 🚀 Live Demo

> [Deploy link goes here after Railway deployment]

**Demo Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | password123 |
| Member | member@demo.com | password123 |

## ✨ Features

- **Authentication** — JWT-based signup/login with role selection
- **Role-Based Access** — Admin can create projects, assign tasks, manage members; Members can view and update task status
- **Project Management** — Create projects, add/remove team members, track progress
- **Task Management** — Create tasks, assign to members, set priority & due dates
- **Kanban Board** — Visual task board per project (Todo → In Progress → Review → Done)
- **Dashboard** — Stats overview, recent tasks, overdue alerts
- **Task Filters** — Filter by status, priority, search by name

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite, React Router, Axios |
| Backend | Node.js + Express |
| Database | LowDB (JSON file, zero setup) |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## 📡 REST API Endpoints

### Auth
- `POST /api/auth/signup` — Register user
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (auth required)

### Projects
- `GET /api/projects` — List accessible projects
- `POST /api/projects` — Create project (Admin)
- `GET /api/projects/:id` — Project details + tasks + members
- `PUT /api/projects/:id` — Update project (Admin)
- `DELETE /api/projects/:id` — Delete project (Admin)
- `POST /api/projects/:id/members` — Add member (Admin)
- `DELETE /api/projects/:id/members/:userId` — Remove member (Admin)

### Tasks
- `GET /api/tasks` — List tasks (filtered)
- `POST /api/tasks` — Create task (Admin)
- `GET /api/tasks/:id` — Task details
- `PUT /api/tasks/:id` — Update task (Admin: all fields; Member: status only)
- `DELETE /api/tasks/:id` — Delete task (Admin)

### Dashboard
- `GET /api/dashboard` — Stats + recent tasks + overdue tasks

### Users
- `GET /api/users` — List all users

## 🚀 Local Development

```bash
# Clone the repo
git clone <your-repo-url>
cd team-task-manager

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Seed demo data
cd ../backend && node seed.js

# Start backend (port 3001)
cd backend && node server.js

# Start frontend (port 5173)
cd frontend && npm run dev
```

## 🌐 Deploy on Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Set environment variable: `JWT_SECRET=your_secret_here`
4. Railway auto-detects the config and deploys
5. After deploy, SSH into the service and run `node backend/seed.js` to seed demo data

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── users.js
│   │   └── dashboard.js
│   ├── middleware/auth.js
│   ├── db.js
│   ├── seed.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   ├── Tasks.jsx
│       │   └── Users.jsx
│       ├── components/Sidebar.jsx
│       ├── context/AuthContext.jsx
│       └── api.js
├── railway.toml
├── nixpacks.toml
└── README.md
```
