# Playwright Visual Baselines

This directory stores desktop visual regression baselines used by:

- `npm run test:visual-smoke`

To refresh baselines after intentional UI changes:

```bash
npm run test:visual-smoke:update
```

The script captures these pages at `1440x900` with reduced motion and WebGL disabled for deterministic layout snapshots:

- `overview`
- all demo routes from `config/demo-scenes.json`
