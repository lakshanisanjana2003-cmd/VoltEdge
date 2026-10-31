# VoltEdge – Electrical Design Office Management System

VoltEdge is a web application that helps an electrical design office manage its **projects, clients, professionals, drawings, site visits and test certificates** in one place.
It was built using the **MERN stack**.

| Part | Technology | Folder |
|---|---|---|
| Database | MongoDB (with Mongoose) | – |
| Backend API | Node.js + Express 5 | `backend/` |
| Frontend | React 19 (Vite, Tailwind CSS, shadcn/ui components) | `frontend/` |

The React app never talks to MongoDB directly. It sends requests to the Express API, and only the API talks to MongoDB.
Login uses a JWT token (valid for 7 days). Passwords are stored only as bcrypt hashes.

---

## 1. Development stages

The project was developed in two stages. Both stages follow the same pattern: a Mongoose model → validation → Express controller and route → React page that calls the API.

### Stage 1 – Core modules

| Module | Backend | Frontend |
|---|---|---|
| **Authentication** | `authController`, `User` model. Register, login, `GET /api/auth/me`. Staff IDs (`U01`, `U02`, …) are generated automatically using a counter. | `AuthPage` (sign in / register) and a login check in `App.jsx` |
| **Professionals** | `Professional` model, `professionalController`. Full CRUD. | `ProfessionalsPage` (uses the shared `SimpleRecordPage`) |
| **Clients** | `Client` model, `clientController`. Full CRUD. | `ClientsPage` (uses `SimpleRecordPage`) |
| **Projects** | `Project` model linked to a client and two professionals (design engineer, draughtsman). Search, filter and sort in the API. | `ProjectsPage` (table, filters, pagination), `ProjectForm`, `ProjectDetailsPage` |
| **Dashboard** | Uses the project list from `GET /api/projects` | `DashboardPage`: totals (all / ongoing / planned / completed), deadlines in the next 60 days, overdue projects. The bell icon in the top bar shows the overdue count. |
| **Settings** | `GET/POST/PUT /api/professionals/me` | `SettingsPage`: account details, own professional profile (create / edit), About VoltEdge |
| **Admin** | `userController`, `requireAdmin` middleware, `make-admin.js` script | `UsersPage` (admin only): list accounts and change a role between `staff` and `admin` |

### Stage 2 – Operational modules

| Module | Backend | Frontend |
|---|---|---|
| **Site Visits** | `SiteVisit` model (project, date, visited by, purpose, inspection notes, follow-up actions, status). Full CRUD. | `SiteVisitsPage` |
| **Testing and Certification** | `TestRecord` model (project, test type, date, tested by, result, measurements, remarks, certificate number and date). Full CRUD. | `TestingPage` |
| **Drawings and Documents** | `Drawing` model with an embedded list of revisions. PDF upload with `multer` (PDF only, max 10 MB, real PDF check). Files are stored in `backend/uploads/` and downloaded only through the API by a signed-in user. | `DrawingsPage`: add / edit / delete a drawing, upload a new revision, download a revision file |

In the app, **Drawings and Documents is one module**. The document side is covered by the *Document type* field (Tender Drawing, Construction Drawing, Shop Drawing, As built Drawing, Other).

---

## 2. Implemented features

| Feature | Notes |
|---|---|
| Staff register / sign in (Officer ID or staff number + password) | JWT, bcrypt, automatic staff IDs |
| Projects: create, read, update, delete | Delete is blocked while the project still has drawings, site visits or test records |
| Projects: search, filter, sort, pagination | Search by ID or name; filter by status, building type and start date; sort by newest, name or deadline; 10 rows per page |
| Clients: create, read, update, delete | Only an administrator can delete |
| Professionals: create, read, update, delete | Only an administrator can delete |
| Dashboard | Project totals, upcoming deadlines, overdue projects |
| Settings / own professional profile | One profile per account |
| Admin: user accounts and roles | Admin can list users and change roles. The first admin is made with a script (see section 4) |
| Site Visits: create, read, update, delete | Text search on the table |
| Testing and Certification: create, read, update, delete | Text search on the table |
| Drawings: create, read, update, delete | Text search on the table |
| Drawing PDF upload, revisions and download | Each upload is saved as a revision (A, B, C …) |
| Validation (frontend and backend) and error messages | Field messages are shown next to the form fields; backend validation protects the data |
| Responsive layout | Sidebar becomes a slide-out menu on small screens; tables scroll sideways |

### Role rules

| Action | Staff | Admin |
|---|---|---|
| Create and edit clients, professionals, projects, drawings, site visits, tests | Yes | Yes |
| Delete projects, drawings, site visits, tests | Yes | Yes |
| Delete clients and professionals | No | Yes |
| Open User Accounts page / change roles | No | Yes (cannot change own role) |

---
## 3. Requirements

- Node.js 18 or newer.
- MongoDB Atlas account and a configured database connection string.
- Internet connection to access MongoDB Atlas.
- Visual Studio Code (recommended).
- MongoDB Compass (optional, for viewing and managing database collections).


## 4. How to run it in Visual Studio Code

Open the project folder in VS Code. Open **two terminals** (Terminal → New Terminal).

**Terminal 1 – Backend**

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` (Windows: `copy .env.example .env`).

Open the `.env` file and configure:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000
```

Replace the MongoDB URI with your own MongoDB Atlas connection string. Make sure the database name is included in the connection string.

Start the backend:

```bash
npm run dev
```

The API runs at `http://localhost:5000/api`. You should see `Connected to MongoDB` when the database connection is successful.

**Terminal 2 – frontend**
```bash
cd frontend
npm install
copy .env.example .env      # Mac/Linux: cp .env.example .env
npm run dev                 # open http://localhost:5173
```

On the sign-in page click **New staff member? Register**, create an account (for example Officer ID `EDO-014`) and sign in.
The first account gets staff number `U01`. You can sign in with the Officer ID or with `U01`.

**Making an administrator.** New accounts are always `staff`. To get an admin (needed to delete clients and professionals and to open *User Accounts*), run this in the backend folder, then sign in again:
```bash
npm run make-admin -- U01
```
After that, the admin can promote other users from the **User Accounts** page.

**Setting up your own profile.** Open **Settings / About** and fill in *My professional profile*. A reminder banner is shown until you do.

If you open the frontend on another address, add it to `CLIENT_ORIGIN` in `backend/.env` and restart the backend.

Drawing PDF files are saved in `backend/uploads/` (this folder is not committed to Git).

## 5. How to test CRUD and MongoDB persistence

The same steps work for any module. Projects are shown as the main example.

1. **Create:** Projects → *Add project* → fill the project ID, name and building type → *Save project*. The project appears in the table.
2. **Validation:** try to save with an empty name. A red message appears. Try an existing Project ID. The server rejects it.
3. **Read:** click the project name to open the details page.
4. **Update:** click the pencil icon, change the name, save. The table shows the new name.
5. **Search / filter / sort:** type part of a name in "Search ID or name", then try the status and building type filters and the sort drop-down.
6. **Persistence – refresh:** press F5. The project is still there.
7. **Persistence – restart:** stop the backend (Ctrl+C in terminal 1), start it again with `npm run dev`, reload the page. The project is still there.
8. **Delete:** click the bin icon → confirm *Delete*. The project is removed, and stays removed after a refresh.
9. **Look in MongoDB Atlas:** Sign in to MongoDB Atlas, open the project and cluster used by VoltEdge, and select the database specified in `MONGODB_URI`. Open the `projects` collection to view the project documents stored by the application.

   **Optional:** MongoDB Compass can also be used to connect to the same Atlas cluster and view the collections.

Stage 2 checks:
* **Drawings:** Drawings and Documents → *Add drawing* → choose a project, enter a drawing number and title, attach a PDF. The PDF becomes revision **A**. Use the revisions icon to upload revision B and to download a file.
* **Site Visits / Testing:** add a record, edit it, delete it. Both need an existing project.

## 6. Automated tests

```bash
cd backend  && npm test     # 39 API tests
cd frontend && npm test     # 13 tests for the helper functions
```
The backend tests need MongoDB running and an extra line in `backend/.env`:
```
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/voltedge_test
```
The database name must end with `_test` and must be different from your real database. Otherwise the tests refuse to run, so your real data is never touched.

The backend tests cover login and roles, project CRUD, validation, search / filter / sort, persistence, client and professional rules, staff ID generation, and drawing PDF upload.

## 7. API endpoints

All endpoints except `health`, `register` and `login` need the header `Authorization: Bearer <token>`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Check the server |
| POST | `/api/auth/register`, `/api/auth/login` | Create account / sign in |
| GET | `/api/auth/me` | Signed-in staff member |
| GET, POST | `/api/projects` | List (optional `?q=&status=&building_type=&start_from=YYYY-MM-DD&sort=newest\|name\|deadline`) / create |
| GET, PUT, DELETE | `/api/projects/:id` | Read, update, delete one project |
| GET, POST | `/api/clients`, `/api/professionals` | List / create |
| PUT | `/api/clients/:id`, `/api/professionals/:id` | Update |
| DELETE | `/api/clients/:id`, `/api/professionals/:id` | Delete (**admin only**) |
| GET, POST, PUT | `/api/professionals/me` | Read / create / edit my own professional profile |
| GET, POST | `/api/site-visits` | List / create |
| PUT, DELETE | `/api/site-visits/:id` | Update / delete |
| GET, POST | `/api/test-records` | List / create |
| PUT, DELETE | `/api/test-records/:id` | Update / delete |
| GET, POST | `/api/drawings` | List / create (POST accepts an optional PDF in the field `file`) |
| PUT, DELETE | `/api/drawings/:id` | Update / delete (delete also removes the files) |
| POST | `/api/drawings/:id/revisions` | Upload a new revision (PDF) |
| GET | `/api/drawings/:id/revisions/:revisionId/file` | Download a revision file |
| GET | `/api/users` | List accounts (**admin only**) |
| PUT | `/api/users/:id/role` | Change a role (**admin only**) |

Errors come back as JSON: `{ "message": "...", "errors": { "fieldName": "..." } }`.
Status codes: 400 invalid data, 401 not signed in, 403 not allowed, 404 not found.

## 8. Validation and error handling

* **Frontend:** `frontend/src/lib/projectHelpers.js` (project form) and `frontend/src/components/SimpleRecordPage.jsx` (all other forms). Errors appear next to the field, and toast messages show success or failure.
* **Backend** (the one that really protects the data): `backend/utils/validation.js`. It checks required fields, ID format, email and phone format, real dates, allowed drop-down values, valid MongoDB ids, and that linked records (client, professional, project) still exist. Duplicate IDs are rejected.
* **Errors:** `backend/middleware/errorMiddleware.js` returns clear JSON for bad JSON, unknown routes, oversized or wrong files, duplicates and unexpected errors. The frontend shows "Cannot reach the server" if the backend is off, and signs the user out when the token expires.

## 9. Database design

Seven MongoDB collections plus a small counter collection:

| Collection | Main links |
|---|---|
| `users` | Officer ID, staff code, role, password hash |
| `professionals` | optional link to a `user` (one profile per account) |
| `clients` | – |
| `projects` | `client`, `design_engineer`, `draughtsman` (professionals), `created_by` (user) |
| `drawings` | `project`; revisions are embedded in the drawing and each has `uploaded_by` (user) |
| `sitevisits` | `project`, `visited_by` (professional) |
| `testrecords` | `project`, `tested_by` (professional) |
| `counters` | used to generate staff IDs (`U01`, `U02`, …) |

Rules in the code:
* Deleting a **client** or **professional** keeps the projects, site visits and tests and clears the link.
* Deleting a **project** is refused while it has drawings, site visits or test records.
* Unique values: officer ID, staff code, project ID, drawing number.

The ERD is in `docs/ERD.md` (it shows in GitHub and in VS Code with a Mermaid preview extension).

## 10. Project structure

```
backend/
  server.js        starts the server and connects to MongoDB
  app.js           Express setup (CORS, JSON, routes)
  models/          Mongoose schemas: User, Professional, Client, Project, Drawing, SiteVisit, TestRecord, Counter
  routes/          which URL calls which function
  controllers/     the code for each request
  middleware/      login / admin check, file upload, error handling
  utils/           validation.js and constants.js
  seed.js          demo data (clients, professionals, projects)
  make-admin.js    turns an account into an administrator
  tests/           API tests
  uploads/         saved drawing PDFs (not committed)

frontend/src/
  main.jsx, App.jsx    start of the app and the list of pages
  pages/               one file per page (Dashboard, Projects, Clients, Professionals,
                       Drawings, SiteVisits, Testing, Settings, Users, Auth ...)
  components/          AppShell (sidebar + top bar), ProjectForm, SimpleRecordPage,
                       ConfirmDelete, ui/ (buttons, dialogs ...)
  lib/api.js           every request to the API
  lib/auth.js          saves the login token
  lib/projectHelpers.js  small helper functions + project validation

docs/
  ERD.md               entity relationship diagram
```
