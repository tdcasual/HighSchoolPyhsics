# Playwright Visual Baselines

Baselines for `npm run test:visual-smoke`, one folder per profile:

- `desktop/` — 1920×1080 by day (stored at half scale)
- `night/` — 1920×1080 in night mode (stored at half scale)
- `phone/` — 390×844 touch phone

Each page has a full-screen image (`<id>.png`, 4 % tolerance; WebGL antialiasing varies) and, for scenes, an image of the data panel alone (`<id>.data.png`, 0.1 % tolerance): a reading that changes colour is about 0.3 % of the panel and would vanish inside the full-screen tolerance. Panels whose readings depend on when the opening animation is paused are listed in `PANEL_UNSTABLE` in the script.

Pages: `overview` and every route in `config/demo-scenes.json`, opened fresh (no remembered parameters), with reduced motion and SwiftShader WebGL; scenes that play on open are paused before the snapshot.

After an intentional UI change, review the new images and refresh:

```bash
npm run test:visual-smoke:update                         # everything
npm run test:visual-smoke:update -- --profile=night mhd   # one profile, one page
```

Set `CHROME_PATH` to use a system Chrome and `PLAYWRIGHT_SERVER_MODE=preview` to run against the production build.
