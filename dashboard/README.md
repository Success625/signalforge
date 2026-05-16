# SignalForge Dashboard 🚀

![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)
![pnpm](https://img.shields.io/badge/pnpm-10-orange.svg)

## Project Name and Description

**SignalForge Dashboard** is the frontend UI for SignalForge, an AI-powered crypto monitoring tool. While the backend handles "early meme discovery" and "smart money tracking" via Birdeye API and Gemini AI, this Next.js dashboard visualizes that alpha in real-time. It displays top opportunities, current momentum signals, risk metrics, and smart money scores in a clean, user-friendly interface.

## Technology Stack

- **Next.js (App Router)** - React framework
- **React** - UI library
- **TypeScript** - Static typing
- **Tailwind CSS** - Utility-first styling
- **pnpm** - Package manager

## Project Architecture

The dashboard serves as the visual presentation layer for the SignalForge ecosystem. It evaluates state and interacts with the APIs to retrieve:

- Top wallet opportunities (synced via Supabase)
- Narrative momentum and capital rotation tracking
- Risk summaries (holder concentration) and conviction scores synthesized by the AI Insight Layer.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- [pnpm](https://pnpm.io/installation) installed

### Installation & Setup

1. Navigate to the dashboard directory:
   ```bash
   cd dashboard
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```text
dashboard/
├── app/               # Next.js App Router (pages and layouts)
│   ├── globals.css    # Global Tailwind styles
│   ├── layout.tsx     # Root layout structure
│   └── page.tsx       # Main dashboard entry page
├── public/            # Static assets
├── next.config.ts     # Next.js build configuration
└── tsconfig.json      # TypeScript configuration
```

## Key Features

- **Signal Dashboard:** Real-time display of top opportunities.
- **Metric Visualizations:** Momentum scores, risk scores (anti-rug metrics), and smart money scores.
- **Narrative Tracking:** Discover trending sectors and AI meme coins.
- **Responsive UI:** Built with Tailwind CSS for mobile and desktop compatibility.

## Development Workflow

Active development takes place within the Next.js `app` folder, following standard component-driven design patterns. The frontend is deployed on Vercel and communicates with the backend hosted on Railway, utilizing Supabase for persistent data storage like tracked wallets.

## Coding Standards

- Modern React Functional Components
- TypeScript for strong typing and interface definitions
- Tailwind CSS layout conventions
- Standard ESLint formatting integrations

## Testing

_Testing setup to be integrated as the application scales._
