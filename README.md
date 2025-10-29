# T2D — X4 Lite (Browser, No-Build)

**Version:** v0.1.0  
**Stack:** Reines HTML + JS + CSS mit [PixiJS CDN] – _keine Installation nötig_.  
**MVP-Loop:** Fliegen · Asteroiden minen (Leertaste) · an Station andocken (E) · Erz verkaufen · Upgrades · Autosave (localStorage).

## Schnellstart (lokal oder GitHub Pages)
1. Entpacke das ZIP.
2. Öffne `index.html` **direkt** im Browser (oder hoste den Ordner auf GitHub Pages/Netlify).
3. Steuerung:
   - **WASD / Pfeile**: Flug/Rotation
   - **Leertaste**: Minen
   - **E**: Andocken / Abkoppeln
   - **1/2/3**: Triebwerksstufen
   - **M**: Minimap ein/aus

## Deploy auf GitHub Pages
- Neues Repo erstellen, Ordner-Inhalt pushen.
- **Settings → Pages → Branch `main` / root** aktivieren.
- Seite öffnet sich unter `https://<user>.github.io/<repo>/`.

## Nächste Schritte (Roadmap kurz)
- Waffen & einfache Gegner (Piraten)
- Handelsgüter (mehr als Erz), Preisdynamik pro Station
- Sektor-Gates + zweite Karte
- Fraktionsruf & Patrouillen
- Docking-UI: Module/Slots, Triebwerks-/Laser-Upgrades
- Save/Load auf **IndexedDB** migrieren (größere Daten)
