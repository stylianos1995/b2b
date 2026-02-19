# B2B MVP – Setup guide

What you need to run the API and log in from the test page.

---

## 1. Install Node.js

- Install **Node.js** (LTS) from [nodejs.org](https://nodejs.org).
- In the project folder run: `npm install`.

---

## 2. Install and run PostgreSQL

The API stores data in **PostgreSQL**. You need a running PostgreSQL server and a database.

### Option A – Install PostgreSQL on Windows

1. Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/).
2. Run the installer. Remember the password you set for the `postgres` user.
3. Ensure the PostgreSQL service is running (e.g. Services → postgresql-x64-15).
4. Create a database for the project, e.g. in **pgAdmin** or **psql**:
   ```sql
   CREATE DATABASE b2b_mvp;
   ```

### Option B – Docker

If you have Docker:

```bash
docker run -d --name b2b-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=b2b_mvp -p 5432:5432 postgres:15
```

This creates a database `b2b_mvp` with user `postgres` and password `postgres`.

---

## 3. Configure the project

1. Copy the example env file:
   ```powershell
   copy .env.example .env
   ```
2. Edit **.env** and set at least:
   - **DATABASE_URL** – connection string to your PostgreSQL database.
     - Example (local PostgreSQL, user `postgres`, password `postgres`, database `b2b_mvp`):
       ```
       DATABASE_URL=postgresql://postgres:postgres@localhost:5432/b2b_mvp
       ```
   - **JWT_SECRET** – any long random string for development.

---

## 4. Create tables (migrations)

Run migrations so the database has the right tables:

```powershell
npm run migrate
```

---

## 5. Seed data and login

You need **seed data** so that users like `buyer@mvp.local` exist.

### Option A – From the test page (no extra install)

1. Start the API: `npm run start:dev`.
2. Open **test-api.html** in your browser.
3. Click **1. Run seed** – this inserts the seed users and other MVP data.
4. Click **2. Fix seed passwords** – sets password to `password` for seed users.
5. Click **3. Login** with email `buyer@mvp.local` and password `password`.

### Option B – From the command line

If you have **psql** (installed with PostgreSQL or separately):

```powershell
# PowerShell: load DATABASE_URL from .env then run seed
$env:DATABASE_URL = (Get-Content .env | Where-Object { $_ -match '^DATABASE_URL=' }) -replace '^DATABASE_URL=',''
psql $env:DATABASE_URL -f src/seeds/seed-mvp.sql
```

Then in the test page click **2. Fix seed passwords** and **3. Login**.

Or use the Node script (no psql):

```powershell
npm run seed:fix-passwords
```

This only updates existing users’ passwords; it does not create users. So run the seed (Option A or B) first.

---

## Summary

| Step | What to do                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Install Node.js, run `npm install`                                                                                              |
| 2    | Install/run PostgreSQL, create database `b2b_mvp`                                                                               |
| 3    | Copy `.env.example` to `.env`, set `DATABASE_URL` and `JWT_SECRET`                                                              |
| 4    | Run `npm run migrate`                                                                                                           |
| 5    | Run seed (test page **1. Run seed** or `psql ... -f src/seeds/seed-mvp.sql`), then **2. Fix seed passwords**, then **3. Login** |

You do **not** need to install **curl**, **Postman**, or **psql** to test login: use the test page and the **Run seed** / **Fix seed passwords** buttons.

---

## 6. Frontend (optional)

A React frontend is in the **frontend/** folder.

1. From project root: `npm run start:dev` (API)
2. In another terminal: `cd frontend` then `npm install` (once) and `npm run dev`
3. Open **http://localhost:5173**

See **frontend/README.md** for buyer and provider flows.
