# Playwright Visual Baselines

This directory stores desktop visual regression baselines used by:

- `npm run test:visual-smoke`

To refresh baselines after intentional UI changes:

```bash
npm run test:visual-smoke:update
```

The script captures these pages at `1920x1080` (stored at half scale) with reduced motion and SwiftShader WebGL, after the first frames have drawn (set `CHROME_PATH` to use a system Chrome):

- `overview`
- all demo routes from `config/demo-scenes.json`
