# SpeakUp

SpeakUp is a modern English learning platform designed to help users improve their English skills from A1 to C2.

**Learn English. Speak with Confidence.**

## Features

- Grammar
- Vocabulary
- Reading
- Listening
- Speaking
- A1–C2 levels
- Interactive lessons
- Tests
- Progress tracking
- User profile
- Achievements
- Streaks
- Dark mode
- Multilingual interface (English, Russian, Uzbek)
- Responsive design
- Authentication (UI ready; full auth planned)
- PostgreSQL database
- Admin panel

## Screenshots

Screenshots will be added soon.

Planned screenshot placeholders:

- Dashboard
- Vocabulary
- Reading
- Listening
- Speaking
- Test
- Profile
- Settings

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Backend

- Next.js Server
- API Routes

### Database

- PostgreSQL
- Prisma

### Authentication

- Schema and login/register UI are prepared
- Guest progress currently works via browser localStorage
- Full authentication is planned for a later stage

### Internationalization

- next-intl (EN / RU / UZ)

### Tools

- Git
- GitHub
- Docker

## Project Structure

```text
speakup/
├── src/
│   ├── app/              # Next.js App Router (pages + API)
│   ├── components/       # UI and feature components
│   ├── data/             # Curriculum and skills content
│   ├── i18n/             # Locale routing and config
│   ├── lib/              # Shared utilities (Prisma, progress)
│   ├── services/         # Server-side domain services
│   └── middleware.ts
├── public/               # Static assets
├── prisma/               # Schema, migrations, seed
├── messages/             # i18n translation files
├── scripts/              # DB helpers and utilities
├── docker-compose.yml    # Local PostgreSQL
├── package.json
├── README.md
├── .env.example
├── .gitignore
└── ...
```

## Getting Started

### 1. Clone

```bash
git clone YOUR_REPOSITORY_URL
cd speakup
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env
```

On Windows (PowerShell), you can also create `.env` manually:

```powershell
Copy-Item .env.example .env
```

Or create a new `.env` file and copy the variable names from `.env.example`.

Fill in at least:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |

Optional:

| Variable | Description |
|----------|-------------|
| `SPEAKUP_PG_HOME` | Path to a portable PostgreSQL install for `npm run pg:start` |

Example format:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/speakup?schema=public"
```

If you use the included Docker Compose setup, match the username, password, database name, and port from `docker-compose.yml`.

### 4. Database

Start PostgreSQL with Docker:

```bash
docker compose up -d
```

Then apply the schema and verify the connection:

```bash
npm run db:push
npm run db:check
```

Optional seed (curriculum and sample skill content):

```bash
npm run db:seed
```

Other useful database scripts:

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
npm run db:stats
```

### 5. Run development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 6. Production build

```bash
npm run build
```

This command generates the Prisma client and checks that the Next.js production build succeeds.

Then you can start the production server:

```bash
npm run start
```

## Database

SpeakUp uses PostgreSQL with Prisma ORM.

Basic flow:

```text
Docker
  ↓
PostgreSQL
  ↓
Prisma
  ↓
Next.js
```

1. Start PostgreSQL (`docker compose up -d`)
2. Set `DATABASE_URL` in `.env`
3. Push the schema (`npm run db:push`)
4. Run the app (`npm run dev`)

Never commit real database credentials. Use `.env` locally and keep secrets out of Git.

## Contributing

1. Fork the repository
2. Create a branch
3. Make changes
4. Test the project (`npm run lint`, `npm run build`)
5. Create a Pull Request

## License

License information will be added later.

## GitHub

### Recommended repository name

- `speakup`
- or `speakup-english-learning-platform`

### Suggested repository description

Modern English learning platform from A1 to C2 with interactive lessons, tests, progress tracking, vocabulary, reading, listening and speaking practice.

### Suggested GitHub topics

`nextjs` `react` `typescript` `tailwindcss` `prisma` `postgresql` `english-learning` `education` `edtech` `language-learning` `fullstack` `web-development`

### Publish to GitHub

Create an empty repository on GitHub, then run:

```bash
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git branch -M main
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your real repository URL.
