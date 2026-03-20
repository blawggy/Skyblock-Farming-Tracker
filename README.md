# 🍈 Skyblock Farming Tracker

A **Melon Crop Farming Tracker** for Hypixel SkyBlock, powered by the [Elite Skyblock API](https://api.eliteskyblock.com/).

Static site — open `index.html` directly in a browser or deploy to GitHub Pages, no build step required.

---

## 📸 Screenshot

> _Load the app in your browser to see it in action!_

---

## ✨ Features

| Feature | Description |
|---|---|
| **Player Lookup** | Enter any Minecraft username to fetch their SkyBlock data |
| **Profile Selection** | Choose from all of the player's SkyBlock profiles |
| **Melon Dashboard** | View melon collection, farming level/XP, farming weight, and melon-specific weight |
| **Milestone Progress** | Visual progress bars for all 9 melon collection milestone tiers |
| **Session Tracker** | Start / stop farming sessions — tracks melons farmed, duration & melons/hour |
| **Session History** | Persisted in `localStorage` — survives page reloads |
| **Responsive Design** | Works on desktop and mobile (min-width 320 px) |
| **Error Handling** | Friendly messages for player-not-found, API errors, and network failures |

---

## 🚀 How to Use

### Option 1 — Open locally
1. Clone or download this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
3. Enter a Minecraft username and click **Search**.

### Option 2 — GitHub Pages
1. Go to **Settings → Pages** in your repository.
2. Set the source to the `main` branch, root folder.
3. Save — GitHub will publish the site at `https://<your-username>.github.io/<repo-name>/`.

### Option 3 — Docker
```bash
# Build and run with Docker Compose (recommended)
docker compose up -d

# Or build and run manually
docker build -t skyblock-farming-tracker .
docker run -d -p 8080:80 skyblock-farming-tracker
```
Then open **http://localhost:8080** in your browser.

---

## 📡 API Credits

| API | Usage |
|---|---|
| [Elite Skyblock API](https://api.eliteskyblock.com/) | Player accounts, farming weight, crop collections |
| [Mojang API](https://api.mojang.com/) | Username → UUID conversion |
| [mc-heads.net](https://mc-heads.net/) | Player avatar/skin rendering |

---

## 🗂 File Structure

```
index.html          — Main HTML page
css/
  styles.css        — All styles (melon-themed green/red color scheme)
js/
  app.js            — Application logic, DOM manipulation, event handlers
  api.js            — API service layer (Mojang + Elite Skyblock API)
  session.js        — Session tracking with localStorage
  utils.js          — Helper functions (number/time formatting, milestones)
Dockerfile          — Docker image definition (nginx)
docker-compose.yml  — Docker Compose service definition
.dockerignore       — Files excluded from the Docker build context
README.md
LICENSE
```

---

## 🛠 Tech Stack

- **HTML5 / CSS3 / Vanilla JavaScript** (ES Modules, no frameworks)
- **Fetch API** for HTTP requests
- **localStorage** for session persistence
- **Google Fonts** — Poppins

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.
