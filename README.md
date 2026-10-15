# Ridham Chawala — portfolio

A static site with no build step. Host the folder on any static host, such as Netlify, Vercel or GitHub Pages.

```
index.html                 Homepage
work/*.html                Four case studies
assets/styles.css          Design system (tokens at the top)
assets/main.js             Navigation, tabs, playground demos, lazy 3D loader
assets/hero3d.js           three.js hero scene (lazy-loaded; ES module from jsDelivr)
assets/img/                Portrait, WonderWord logo and screenshots (taken from portfolio1.html)
```

To preview locally, run `python3 -m http.server 8765` and open http://localhost:8765. Use a server rather than opening the file directly: browsers block the 3D module on `file://`, so you'd only see the static hero.

The 3D scene loads only on screens ≥900px wide that support WebGL and have no reduced-motion preference. It pauses when it's offscreen. Everywhere else, the static SVG composition is shown.
