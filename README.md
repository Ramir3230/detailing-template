# Detailing studio website template

A website template for car-detailing studios in Poland. One codebase serves client sites and
personal pitch demos: for a new studio I change the data file and the theme, not the code.
Polish is the main language, Russian the second.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, Vitest. Deployed on Vercel on
every push to `main`.

## How the work is organised

I build this project with Claude Code. The repository is set up so that the AI agent works by
the project's rules, not by guesswork:

- **Documents first.** [BRIEF.md](BRIEF.md) (product, audience, what we deliberately don't do),
  [DESIGN.md](DESIGN.md) (visual decisions with reasons), [ROADMAP.md](ROADMAP.md) (what's done
  and what's next). A decision from a chat goes into a document before it goes into code; when
  the documents have no answer, the agent asks.
- **Rules for the agent** in [CLAUDE.md](CLAUDE.md) and [AGENTS.md](AGENTS.md); a reusable skill
  in [`.claude/skills/demo-studio`](.claude/skills/demo-studio) builds a studio demo step by step.
- **One command = CI.** `npm run check` runs typegen, tsc, eslint, tests, the build and checks of
  the built pages (noindex on demos, page language, hero preload). The same command runs on
  GitHub Actions on every push ([check.yml](.github/workflows/check.yml)).
- **Review.** A separate review agent reads every block of work before it is merged into `main`.

Project documents and code comments are in Russian, my working language with the agent.
Shared Claude Code settings (deny reading `.env*`, a hook that stops pushes to `main`) live in
the parent folder of my projects, outside this repo.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run check   # types, lint, tests, build and checks of built pages — same as CI
```

Asset scripts (hero car cut-out, before/after images, the Kontakt map) and the demo workflow:
[README.ru.md](README.ru.md).
