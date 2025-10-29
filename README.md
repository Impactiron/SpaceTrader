# T2D — X4 Lite (TypeScript + Vite + PixiJS)

**Version:** v0.2.0 · **Stack:** TypeScript, Vite, PixiJS 7  
**Ziel:** Browser-Spiel im Stil von X4 (2D/2.5D).

## Zero-Install: GitHub Pages via Actions
1. Neues GitHub-Repo erstellen und Projekt hochladen.
2. `Settings → Pages`: auf **GitHub Actions** stellen (falls nötig).
3. In `Settings → Secrets and variables → Actions` ein Repository Secret **BASE** anlegen: `/<REPO_NAME>/`
4. Push auf `main` → Aktion baut & deployed nach `gh-pages`.

> Hinweis: Workflow nutzt **npm install** statt `npm ci`, damit kein Lockfile nötig ist.

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
- `vite.config.ts` – `base` für GitHub Pages (alternativ via Secret BASE)
- `.github/workflows/deploy.yml` – Build & Deploy
- `index.html` – HUD/Panel

## Roadmap
Nutze die separate `ROADMAP.md`.
