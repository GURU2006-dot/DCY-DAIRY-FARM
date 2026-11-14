# REST API and PostgreSQL service

Node.js + Express + TypeScript + PostgreSQL. Use `backend/.env.example` as a private environment template. See the root README for full local and deployment steps.

Quick setup from repository root:

```bash
npm install
# configure backend/.env with DATABASE_URL and SESSION_SECRET
npm run db:migrate
# set ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD in backend/.env
npm run admin:init
npm run dev
```

The admin bootstrap requires a unique email and a 14+ character mixed-case password with a digit and symbol; there is no default admin. Never commit `.env` files.

Migration `001_core.sql` creates the required tables, checks, indexes and foreign keys. The optional sample seeder requires `ALLOW_SAMPLE_DATA=YES`, refuses production and marks its records `is_sample`; checkout rejects those items. Customer order prices are recalculated from PostgreSQL inside a transaction, not trusted from the browser.
