<p align="center">
  <img src="https://anilist.co/img/icons/android-chrome-512x512.png" alt="AniList Logo" width="120" />
</p>

<h1 align="center">qAnimeRanker</h1>

<p align="center">
  <strong>✨ A vibe coding project ✨</strong>
</p>

<p align="center">
  Drag-and-drop anime ranking tool that syncs with your AniList account
</p>

<p align="center">
  <a href="https://qanimeranker.qstivi.com">🌐 Live Demo</a> •
  <a href="https://qanimeranker-dev.qstivi.com">🧪 Dev</a> •
  <a href="#features">✨ Features</a> •
  <a href="#tech-stack">🛠️ Tech Stack</a> •
  <a href="#getting-started">🚀 Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express" alt="Express 5" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite" alt="Vite 7" />
</p>

---

## 🎯 What is this?

**qAnimeRanker** is a personal project born from the desire to rank my completed anime in a more visual and intuitive way than AniList's default scoring system allows.

> *"Sometimes you just want to drag your favorite anime above another one and call it a day."*

This is a **vibe coding project** — built for fun, learning, and scratching my own itch. It's not meant to be a polished product, but rather a playground for experimenting with modern web technologies while solving a real problem I had.

## ✨ Features

- 🔐 **AniList OAuth Integration** — Log in with your AniList account
- 📋 **Drag & Drop Ranking** — Intuitive ranking with smooth animations
- 📁 **Folder Organization** — Group your anime into custom folders (iOS-style)
- 🔄 **Cloud Sync** — Your rankings persist across devices
- 📤 **Export/Import** — Backup your rankings as JSON
- 🎨 **Grid & List Views** — Toggle between viewing modes
- 🌙 **Markers** — Add visual markers to separate tiers

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite 7** for blazing fast builds
- **@dnd-kit** for drag and drop
- Custom CSS (no framework, just vibes)

### Backend
- **Express 5** (Node.js 20)
- **MariaDB** for persistent storage
- **JWT** in httpOnly cookies
- **helmet.js** + rate limiting for security
- **prom-client** for Prometheus metrics

### Infrastructure
- **Proxmox LXC** containers
- **Nginx Proxy Manager** for reverse proxy
- **Cloudflare** for DNS & SSL
- **GitHub Actions** for CI/CD
- **Cloudflare Tunnel** for secure deployments
- **Fail2ban** for SSH brute-force protection
- **Unattended upgrades** for automatic security patches
- **Prometheus + Grafana** for monitoring & alerting

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- MariaDB (or MySQL)
- An [AniList Developer App](https://anilist.co/settings/developer)

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/qStivi/qanimeranker.git
   cd qanimeranker
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Set up environment variables**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your credentials
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Backend
   cd server && npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

5. **Open** [http://localhost:5173](http://localhost:5173)

### Environment Variables

```env
# AniList OAuth
ANILIST_CLIENT_ID=your_client_id
ANILIST_CLIENT_SECRET=your_client_secret
ANILIST_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Database
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=anime_ranker
DATABASE_PASSWORD=your_password
DATABASE_NAME=anime_ranker

# Server
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_random_secret
FRONTEND_URL=http://localhost:5173
```

## 📝 AniList Terms Compliance

This project complies with the [AniList API Terms of Use](https://docs.anilist.co/guide/terms-of-use):

- ✅ Only stores user IDs, folder structure, and ranking order (no anime metadata)
- ✅ Fetches anime data fresh each session
- ✅ Respects rate limits (90 req/min)
- ✅ Non-commercial use
- ✅ Not a competing service

## 🔒 Security

- OAuth secrets kept server-side only
- JWT stored in httpOnly cookies
- Rate limiting on all API endpoints
- Security headers via helmet.js
- CSRF protection via Origin validation
- Zod input validation
- SQL injection prevention with parameterized queries
- CodeQL and Dependabot for vulnerability scanning
- Fail2ban SSH protection
- Automatic security updates

See [SECURITY.md](SECURITY.md) for our security policy and [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for the full audit report.

## 📊 Monitoring

- `/metrics` endpoint exposes Prometheus metrics
- HTTP request rate, duration, and error tracking
- Node.js heap, event loop, and GC metrics
- Grafana dashboards for visualization
- Discord alerts for critical issues (downtime, high error rates)

## 🤝 Contributing

This is a personal vibe project, but if you find a bug or have a cool idea, feel free to open an issue or PR!

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ☕ and good vibes by <a href="https://github.com/qStivi">qStivi</a>
</p>

<p align="center">
  <sub>🤖 Vibe-coded with Claude</sub>
</p>
