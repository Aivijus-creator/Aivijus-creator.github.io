# Tinklinio sistemos · Volleyball Systems

Interaktyvi svetainė apie tinklinio sistemas **5-1, 6-2 ir 4-2** (ir paplūdimio tinklinį 2×2).
Kalbos: **lietuvių** (numatytoji) ir anglų — perjungiama viršuje (LT / EN).

Interactive single-page site teaching indoor volleyball systems 5-1, 6-2 and 4-2, plus a beach 2v2 intro.

## Paleidimas / Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (works from any folder — hash routing)
npm test         # Vitest: overlap, rotations, libero, 6-2 mapping, texts, beach rules
```

## Kas viduje / What's inside

- **Sistemų puslapiai** (`#/5-1`, `#/6-2`, `#/4-2`): 6 rotacijos × 4 fazės (priėmimas, puolimas, padavimas, gynyba),
  animuoti žaidėjai su pozomis, judėjimo rodyklės, persidengimo linijos, kamuolio skrydis („Žaisti“),
  mygtukas **↻ Pereiti** (rotacija su libero keitimu), auto režimas, klavišai → ← Tarpas, brauktukas mobiliajame.
- **Paspausk žaidėją → „Kodėl čia?“**: paaiškinimas, automatinės persidengimo taisyklės ✅/❌, kur bėgs toliau.
- **Taisyklės**, **Palyginimas**, **Smėlio dėžė** (tempk žaidėjus — tikrinimas iš karto), **Testas**, **Paplūdimys 2×2**.
- **3D kamuolys** pradžios puslapyje (Three.js, generuojama mėlyna/geltona tekstūra, užkraunama tik ten).

Terminai LT: kėlėjas (K), krašto puolėjas (KP), vidurio blokuotojas (VB), diagonalinis puolėjas (D), libero (L).

## Structure

```
src/data      types, zones, system51/62/42 tables, phase builders
src/logic     rotate, overlap checker, role mapping, explanations, beach rules
src/i18n      lt.ts, en.ts, provider
src/components Court (SVG), Figure (line-art player with poses), Ball2D + flight, side panel, …
src/pages     Home, Rules, SystemPage, Compare, Sandbox, Quiz, Beach
src/three     Ball3D (lazy-loaded)
src/tests     Vitest suites
```

All graphics are original SVG/procedural; no logos or brand marks.
