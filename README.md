# VoltEdge – Electrical Design Office Management System

A web app for an electrical design office to manage **projects, clients and professionals**.
Made for the Web Application Development mini project with the **MERN stack**.

| Part | Technology | Folder |
|---|---|---|
| Database | MongoDB (with Mongoose) | – |
| Backend API | Node.js + Express | `backend/` |
| Frontend | React (Vite, Tailwind CSS) | `frontend/` |

The React app never talks to MongoDB. It sends requests to the Express API, and only the API talks to MongoDB.

## What works and what does not

| Feature | Status |
|---|---|
| Staff register / sign in (Officer ID + password) | Works |
| **Projects: create, read, update, delete, search, filter, sort, pagination** | Works |
| Clients and Professionals: create, read, update, delete | Works |
| Dashboard (totals, deadlines in 60 days, overdue projects) | Works |
| Validation (frontend and backend) and error messages | Works |
| Drawings, Site Visits, Tenders, Material Approvals, Testing, Payments | **Not built.** The pages say "not built yet" |
| Project tabs (Design, BOQ, Specs ...) | **Not built.** The tabs say "not built yet" |

## Requirements
* Node.js 18 or newer
* MongoDB running on your computer (MongoDB Community Server) **or** a free MongoDB Atlas connection string

## How to run it in Visual Studio Code

Open the project folder in VS Code. Open **two terminals** (Terminal → New Terminal).

**Terminal 1 – backend**
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` (Windows: `copy .env.example .env`). Open `.env` and change `JWT_SECRET` to any long random text. Check that `MONGODB_URI` matches your MongoDB.
```bash
npm run seed      # optional: adds 2 demo clients, 2 professionals and 2 demo projects
npm run dev       # API runs at http://localhost:5000/api
```
You should see `Connected to MongoDB`.

**Terminal 2 – frontend**
```bash
cd frontend
npm install
copy .env.example .env      # Mac/Linux: cp .env.example .env
npm run dev                 # open http://localhost:5173
```

On the sign-in page click **New staff member? Register**, create an account (for example Officer ID `EDO-014`) and sign in.
The first account gets staff number `U01`. You can sign in with the Officer ID or with `U01`.

If you open the frontend on another address, add it to `CLIENT_ORIGIN` in `backend/.env` and restart the backend.

## How to test Project CRUD and MongoDB persistence

1. **Create:** Projects → *Add project* → fill the name and building type → *Save project*. The project appears in the table.
2. **Validation:** try to save with an empty name. A red message appears. Try an existing Project ID. The server rejects it.
3. **Read:** click the project name to open the details page.
4. **Update:** click the pencil icon, change the name, save. The table shows the new name.
5. **Search / filter:** type part of a name in "Search ID or name", then try the status and building type filters.
6. **Persistence – refresh:** press F5. The project is still there.
7. **Persistence – restart:** stop the backend (Ctrl+C in terminal 1), start it again with `npm run dev`, reload the page. The project is still there.
8. **Delete:** click the bin icon → confirm *Delete*. The project is removed, and stays removed after a refresh.
9. **Look in MongoDB:** open MongoDB Compass, connect to `mongodb://127.0.0.1:27017`, open database `voltedge` → collection `projects`. You can see the same documents.

More checks are in `docs/TESTING_CHECKLIST.md`.

## Automated tests
```bash
cd backend  && npm test     # 23 API tests (needs MongoDB running; uses a separate database "voltedge_test")
cd frontend && npm test     # 13 tests for the helper functions
```

## API endpoints
All endpoints except `health`, `register` and `login` need the header `Authorization: Bearer <token>`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Check the server |
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in |
| GET | `/api/auth/me` | Signed-in staff member |
| GET | `/api/projects` | List projects. Optional: `?q=&status=&building_type=&start_from=YYYY-MM-DD&sort=newest\|name\|deadline` |
| POST | `/api/projects` | Create a project |
| GET, PUT, DELETE | `/api/projects/:id` | Read, update, delete one project |
| GET, POST | `/api/clients`, `/api/professionals` | List / create |
| PUT, DELETE | `/api/clients/:id`, `/api/professionals/:id` | Update / delete |

Errors come back as JSON: `{ "message": "...", "errors": { "fieldName": "..." } }`.
Status codes: 400 invalid data, 401 not signed in, 404 not found.

## Validation
* Frontend: `frontend/src/lib/projectHelpers.js` (project form) and `frontend/src/components/SimpleRecordPage.jsx` (clients, professionals).
* Backend (the one that really protects the data): `backend/utils/validation.js`. The messages from the server are shown next to the form fields.

## Project structure
```
backend/
  server.js        starts the server and connects to MongoDB
  app.js           Express setup (CORS, JSON, routes)
  models/          Mongoose schemas: User, Client, Professional, Project
  routes/          which URL calls which function
  controllers/     the code for each request
  middleware/      login check and error handling
  utils/           validation.js and constants.js
  seed.js          demo data
  tests/           API tests

frontend/src/
  main.jsx, App.jsx    start of the app and the list of pages
  pages/               one file per page
  components/          AppShell (sidebar + top bar), ProjectForm, SimpleRecordPage, ui/ (buttons, dialogs ...)
  lib/api.js           every request to the API
  lib/auth.js          saves the login token
  lib/projectHelpers.js  small helper functions + project validation
```

## Database design
See `docs/ERD.md` (the diagram shows in GitHub and in VS Code with a Mermaid preview extension).
