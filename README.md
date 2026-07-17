This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Job Board Phase 1

The Job Board foundation lives under `app/job-board` and is protected by the
existing Supabase login/session flow. Any authenticated user can access it,
including inactive and alumni members.

Environment variables are documented in `.env.example`. The Job Board tables,
RLS policies, indexes, foreign keys, and constraints are defined in
`supabase/migrations/20260715_job_board_phase_1.sql`.

The internal mock careers source for future scraper work lives at:

```bash
/mock-careers
/mock-careers/jobs/[id]
/api/mock-careers/jobs
```

Testing currently uses Node's built-in test runner to avoid adding new test
dependencies during Phase 1:

```bash
npm run test:job-board
npm test
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
