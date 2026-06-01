# Travel AI Platform — Web Frontend

Modern, responsive React frontend for the Travel AI Platform.

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — Lightning-fast build tool
- **TailwindCSS** — Utility-first styling
- **Axios** — HTTP client
- **Lucide React** — Icons

## Features

- **User Preferences** — Save travel preferences (budget, trip type, accommodation, food)
- **Destination Recommendations** — AI-powered destination suggestions
- **Trip Planner** — Full trip planning with weather, budget, itinerary, and travel advice
- **Responsive Design** — Mobile, tablet, and desktop
- **Loading States** — Spinners & disabled buttons during API calls
- **Error Handling** — Friendly error notifications

## Getting Started

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |

## Build

```bash
npm run build
```

Output is in `dist/`.

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

Or connect your GitHub repo on [vercel.com](https://vercel.com) for automatic deploys.

### Vercel Settings

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** Add `VITE_API_BASE_URL`

## Project Structure

```
web/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   └── client.ts              # Axios instance
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── UserPreferences.tsx
│   │   ├── Recommendations.tsx
│   │   ├── TripPlanner.tsx
│   │   ├── WeatherCard.tsx
│   │   ├── BudgetCard.tsx
│   │   ├── ItinerarySection.tsx
│   │   ├── TravelAdvice.tsx
│   │   ├── Spinner.tsx
│   │   └── Notification.tsx
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .env.example
└── README.md
```
