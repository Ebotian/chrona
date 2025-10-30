# Chrono Motion Playground

This playground spins up an isolated Vite app to iterate on `@chrono/motion` scenes and hooks. Use it to validate shader tweaks, scroll interactions, or performance profiles before wiring them into the main application.

## Scripts

- `pnpm playground:dev` – start the playground in development mode.
- `pnpm --filter @chrono/motion-playground build` – produce a production build preview.
- `pnpm --filter @chrono/motion-playground preview` – serve the production build locally.

## Notes

- The playground consumes the local `@chrono/motion` package via the workspace protocol.
- Lenis is initialised globally so remember to destroy listeners when authoring custom demos.
- Keep particle counts modest (\< 12k) when exploring shader ideas to preserve a smooth UX on mid-tier hardware.
