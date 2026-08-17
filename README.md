# Secure Notes — Frontend

A minimal, functional frontend for the [Secure Note-Taking API](https://github.com/alamin71/Secure-Note-Taking-Application). Plain HTML/CSS/JavaScript — no build step, no framework.

## Features

- Login / Register
- Notes: create, edit (modal), delete, paginated list (admins see everyone's notes)
- Posts: write a post, view a user's posts by ID (paginated)
- Admin panel: manage users (create, edit, delete, paginated list), users grouped by interests

## Running Locally

No build tools required — just serve the folder:

```bash
python -m http.server 5500
```

Then open `http://127.0.0.1:5500`. The app expects the backend API running at `http://localhost:5000` (see `js/api.js`).

## Configuration

`js/api.js` picks the API base URL automatically:

- On `localhost` / `127.0.0.1` → talks directly to `http://localhost:5000/api`
- On any other host (e.g. a deployed domain) → uses relative `/api`, assuming a reverse proxy (like Nginx) forwards `/api` to the backend on the same host

## Structure

```
index.html      Page shell + all views (auth, notes, posts, admin)
css/style.css   Styling
js/api.js       Fetch wrapper + JWT token handling
js/app.js       App logic (auth, CRUD, modal, pagination, toasts)
```
