# Elite Dangerous Odyssey Companion

A comprehensive web companion app for Elite Dangerous Odyssey with real-time journal sync, ship management, material tracking, colonisation planning, and more.

## Features

- **Ship Loadout Manager** - Save, view, and compare ship builds
- **Material Tracking** - Track engineering materials inventory
- **Mission Tracking** - Monitor active and completed missions
- **Trading Route Finder** - Find profitable trade routes
- **Colonisation Assist** - Plan colonies with economy recommendations based on system resources
- **Exploration Data** - Track discoveries and exploration progress
- **Real-time Sync** - Desktop agent watches Elite Dangerous journal files
- **OAuth Authentication** - Login with Google or Discord
- **Mobile-Friendly** - Responsive web app that works on all devices

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Desktop Agent**: Electron + Chokidar (journal watcher)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Real-time**: Socket.io WebSocket

## Project Structure

```
elite-companion/
├── apps/
│   ├── web/              # React frontend
│   ├── api/              # Express backend
│   └── desktop/          # Electron desktop agent
├── packages/
│   └── types/            # Shared TypeScript types
└── docker-compose.yml    # PostgreSQL + Redis setup
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for PostgreSQL)

### Installation

1. Clone and install dependencies:

```bash
cd elite-companion
pnpm install
```

2. Start the database:

```bash
docker-compose up -d
```

3. Set up environment variables:

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your OAuth credentials
```

4. Run database migrations:

```bash
pnpm db:migrate
```

5. Start all apps in development:

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001

### OAuth Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

#### Discord OAuth
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Add redirect URI: `http://localhost:3001/auth/discord/callback`
4. Set `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` in `.env`

## Desktop Agent

The desktop agent watches your Elite Dangerous journal files and syncs data to the web app.

1. Start the web app and login
2. Go to Settings → Generate API Token
3. Run the desktop agent:

```bash
pnpm dev:desktop
```

4. Paste your API token when prompted

### Journal File Location

- **Windows**: `%USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous\`

## API Endpoints

### Authentication
- `GET /auth/google` - Google OAuth
- `GET /auth/discord` - Discord OAuth
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Ships
- `GET /api/ships` - List ships
- `POST /api/ships` - Create ship
- `GET /api/ships/:id` - Get ship
- `PUT /api/ships/:id` - Update ship
- `DELETE /api/ships/:id` - Delete ship

### Materials
- `GET /api/materials` - List materials
- `GET /api/materials/inventory` - Get inventory
- `POST /api/materials/inventory/sync` - Sync from journal

### Colonisation
- `GET /api/colonisation/projects` - List projects
- `POST /api/colonisation/projects` - Create project
- `POST /api/colonisation/analyze` - Analyze system resources
- `GET /api/colonisation/requirements/:type` - Get build requirements
- `PUT /api/colonisation/progress/:id` - Update progress

### Journal Sync
- `POST /api/journal/events` - Receive journal events (from desktop agent)

## Development

### Run specific app

```bash
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only
pnpm dev:desktop # Desktop agent only
```

### Build for production

```bash
pnpm build
```

## License

MIT