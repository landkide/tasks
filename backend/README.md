Backend (Express + SQLite)

Setup

-   copy .env and set JWT_SECRET
-   npm install
-   npm run seed (creates ./data/database.sqlite and seeds admin user: userid=admin, password=password)
-   npm run dev

Endpoints

-   POST /api/auth/login { userid, password }
-   GET /api/auth/me (Bearer token)
