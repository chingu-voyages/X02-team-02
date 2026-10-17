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