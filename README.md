# 🎭 Dumb Charades PWA

A fully offline-first Progressive Web App for playing Dumb Charades at house parties.

**Act it out. Guess it fast. No teams needed.**

## Features

- 🎬 300+ movies across Bollywood & Hollywood
- ⚡ Three game modes: Rapid Fire (15s), Classic (30s), Difficult (60s)
- 👥 2–10 players, no even teams required
- 📊 Auto score tracking with history
- ♻️ Anti-repeat movie queue with shuffle-on-exhaust
- 🚫 Foul detection, skip system, split-guess support
- 📱 Mobile-first, one-hand operable
- ✈️ Works fully offline after first load

## Dev

```bash
npm install
npm run dev
```

## Deploy (Free)

### Vercel
```bash
npm run build
# Drag dist/ folder to vercel.com/new
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

## Stack

- React 18 + Vite 8
- TypeScript
- Tailwind CSS v4
- vite-plugin-pwa (Workbox)
