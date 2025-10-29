# SpaceTrader — X4 Lite (TypeScript + Vite + PixiJS)

**Version:** v0.2.0 · **Stack:** TypeScript, Vite, PixiJS 7  
**Ziel:** Browser-Spiel im Stil von X4 (2D/2.5D).

## GitHub Pages (ohne Secret)
- `vite.config.ts` ist bereits auf **'/SpaceTrader/'** gesetzt.
- Push auf `main` genügt → GitHub Action baut & deployed auf **gh-pages**.

## Lokal (optional)
```bash
npm install
npm run dev
# oder
npm run build && npm run preview
```

## Steuerung
- WASD/Pfeile: Flug/Rotation
- Space: Minen
- E: Dock/Undock
- 1/2/3: Triebwerksstufen

## Dateien
- `src/main.ts` – Spiel-Loop, Szene, Input, Mining
- `vite.config.ts` – base = '/SpaceTrader/'
- `.github/workflows/deploy.yml` – Build & Deploy
- `index.html` – HUD/Panel

**Seiten-URL (Beispiel):** https://impactiron.github.io/SpaceTrader/
