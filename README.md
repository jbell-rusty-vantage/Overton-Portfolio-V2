# John Overton Bell — The Library

A 2D software portfolio with six case studies, shared accessible reports, résumé and soccer highlights. Travellers Rest is the optional single 3D world: project books, archival documents and a grounded portrait conversation.

[Portfolio](https://overton-portfolio-v2.vercel.app/) · [Travellers Rest](https://overton-portfolio-v2.vercel.app/library) · [Current status](HANDOFF.md) · [Documentation](docs/README.md)

Use Node 24, `npm ci`, then `npm run dev` for development. `npm run admin:local` opens the real loopback office on port 3078 and writes to its configured database. Samples are fictional browser-local data.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:safety`, and `npm run build:local`. The ordinary `npm run build` also runs guarded migrations; it never resets an existing schema. Preview and Production use separate databases. See the [release runbook](docs/operations/release.md) before deployment or content changes.
