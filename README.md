# Agile Practice Exam

An open-source quiz engine that helps community members practice for Scrum Master and Product Owner certification exams. Built as a Chingu VoyageXP 02 (Team 02) collaborative project.

---

## Key Features

- **Practice exams by certification**: pick a certification (e.g. PSM, PSPO, CSM, CSPO) and take a practice exam
- **Randomized questions**: each attempt draws random questions from the approved pool
- **Instant grading and results**: multiple-choice answers are graded automatically, with a results screen at the end
- **User accounts and answer journal**: register, log in, and review your past attempts and scores
- **Unlimited retakes**
- **Community-submitted questions**: users can propose questions, and admins approve, edit, or reject them before they appear in exams
- **Admin tools**: manage questions, grant or revoke admin rights, and block users
- **Basic admin reports**: which questions are answered wrong most often, and user stats
- **Open source (AGPL)**, delivered as a Docker container

---

## Tech Stack

| Layer                   | Technology                              | Notes                                                                 |
| :---------------------- | :-------------------------------------- | :-------------------------------------------------------------------- |
| **Frontend**            | React 19, Vite, TypeScript | Dev server on port 5173 |
| **Backend** | Node.js, Express      | API on port 3000, health check at `/health` |
| **Database** | PostgreSQL (Docker), Prisma     | PostgreSQL runs in Docker |
| **Tooling** | pnpm workspaces     | Monorepo: `client`, `server`, `shared` |
| **Auth** | WIP |  |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 22 or newer
- [pnpm](https://pnpm.io/installation)
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose v2 (`docker compose` command). [Docker Desktop](https://www.docker.com/products/docker-desktop/) is the easiest option on macOS and Windows.
  Make sure Docker is running before you start the database.

---

## Quick Start

1. **Clone & enter the repo:**

```bash
   git clone https://github.com/chingu-voyages/X02-team-02.git
   cd X02-team-02
```

2. **Install dependencies:**

```bash
   pnpm install
```

3. **Create your local environment file:**

```bash
   cp .env.example .env
```

4. **Start the database, server and client** (make sure Docker is running first):

```bash
   docker compose up -d build
```

5. **Set up the database tables and the Prisma client** (migrations are not run automatically):

```bash
   pnpm --filter @x02/server exec prisma migrate dev
   pnpm --filter @x02/server exec prisma generate
```

6. **Open the app:**

- Client: http://localhost:5173
- Server health check: http://localhost:3000/health (should return `{"status":"ok"}`)

---

## Seed sample questions

Load 30 sample Scrum questions so the question list, and soon the practice quiz, have content to work with. Run this after the database migrations:

```bash
pnpm --filter @x02/server seed
```

Inside Docker, use:

```bash
docker compose exec server pnpm --filter @x02/server seed
```

- It is safe to run more than once. Re-running updates the same questions and does not create duplicates.
- Every seeded question is `APPROVED`, in the `PSM` category, and authored by a `seed-author` account that cannot be logged into.
- To change or add questions, edit `server/src/seed/sample-questions.json` (each entry needs a unique `seedId`) and run the server tests. Seeding overwrites question text with the file's version, so don't edit seeded questions directly in the database.
- If any entry is invalid, nothing is written and the script prints what is wrong.

The sample questions are original. They are based on concepts from the [Scrum Guide](https://scrumguides.org/scrum-guide.html) by Ken Schwaber and Jeff Sutherland, which is published under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). None of them come from a certification provider's assessments.

---

## Practice quiz demo

A public demo of the quiz: 20 random seeded questions, one at a time, with a score and the correct answers at the end. No login needed.

### Demo on your own computer (for example over a screen share)

```bash
docker compose up -d --build
```

```bash
docker compose exec server pnpm --filter @x02/server exec prisma migrate deploy
```

```bash
docker compose exec server pnpm --filter @x02/server seed
```

Then open http://localhost:5173/practice-exam and click **Start quiz**.

### Share a link with a tunnel

A tunnel gives your local app a temporary public web address, so someone else can open it on their own computer. With the app running as above, install [cloudflared](https://github.com/cloudflare/cloudflared/releases) (on macOS: `brew install cloudflared`) and run:

```bash
cloudflared tunnel --url http://localhost:5173
```

It prints an address like `https://something-random.trycloudflare.com`. Share that address followed by `/practice-exam`.

- It only works while your computer, Docker, and the tunnel are all running, and the address changes every time you start it.
- The tunnel exposes the **whole local app** (registration and the question pages too), not just the quiz. Share the link only with people you trust, and press `Ctrl+C` to close the tunnel when you are done.
- The dev server only accepts tunnel addresses from `trycloudflare.com`, `ngrok-free.app`, `ngrok.app`, and `loca.lt`. For another tunnel service, add its domain to `allowedHosts` in `client/vite.config.ts`.

### Turning the quiz on and off

The quiz is on by default in development and **off in production**: with `NODE_ENV=production` the `/api/practice/*` routes answer 404. Set `ENABLE_PUBLIC_PRACTICE=true` to turn it on anyway, or `ENABLE_PUBLIC_PRACTICE=false` to turn it off in development.

This version keeps no history: answers stay in the browser until the end, and nothing is saved.

---

## System Architecture

WIP

---

## License

WIP

---

## Our Team

| Name                       | Role          | Links                                                                                                     |
| :------------------------- | :------------ | :-------------------------------------------------------------------------------------------------------- |
| **Adewale Agboke**         | Scrum Master  | [GitHub](https://github.com/Adewal246) / [LinkedIn](https://linkedin.com/in/adewaleagboke/)               |
| **Tunde Ademola Kujore**   | Product Owner | [GitHub](https://github.com/dhemmyhardy) / [LinkedIn](https://www.linkedin.com/in/tundeademolakujore/)    |
| **Dustin Hoeppner**        | Web Developer | [GitHub](https://github.com/dhoepp) / [LinkedIn](https://linkedin.com/in/dustin-hoeppner)                 |
| **William Barus**          | Web Developer | [GitHub](https://github.com/maki-keep) / [LinkedIn](https://www.linkedin.com/in/william-barus-3821a8234/) |
| **Eva Langerova**          | Web Developer | [GitHub](https://github.com/eva-lng) / [LinkedIn](https://www.linkedin.com/in/eva-langerova-61059027a/)   |