# Pourfoliolic - Drink Tracking Application

## Overview

Pourfoliolic is a drink tracking and logging application that allows users to catalog their beverage experiences. Users can log wines, beers, spirits, and cocktails with detailed tasting notes, ratings, pricing, and personal context. The application provides a dashboard with statistics, a cellar view for browsing logged drinks, and discovery features for recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with shared components. Pages include Dashboard (Home), Log Drink, Cellar (browse drinks), Discovery, and Profile. The sidebar navigation provides desktop and mobile variants.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Development**: Vite dev server proxied through Express for HMR

The server uses a storage abstraction layer (`IStorage` interface) implemented by `DatabaseStorage` class, allowing for potential future storage backend changes.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between frontend/backend)
- **Migrations**: Drizzle Kit with `db:push` command
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

The main data entities are:
- `users`: Basic user accounts with username/password
- `drinks`: Full drink entries with name, maker, type, rating, tasting notes (nose, palate, finish), price, location, pairings, and privacy settings

### API Structure
- `POST /api/drinks` - Create new drink entry
- `GET /api/drinks` - List drinks with filtering and sorting
- `GET /api/drinks/:id` - Get single drink
- `PUT /api/drinks/:id` - Update drink
- `DELETE /api/drinks/:id` - Delete drink
- `GET /api/stats` - Get aggregate statistics

### Build Process
- Client builds to `dist/public` via Vite
- Server bundles to `dist/index.cjs` via esbuild
- Production serves static files from `dist/public`
- Development uses Vite middleware for hot reloading

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- `pg` package for database connections
- `drizzle-orm` for query building and ORM functionality
- `connect-pg-simple` for session storage (prepared but not fully implemented)

### UI Components
- shadcn/ui component library (New York style)
- Radix UI primitives for accessible components
- Lucide icons
- Framer Motion for animations

### Authentication
- **Provider**: Firebase Authentication with Google Sign-in
- **Client SDK**: `firebase` package for browser authentication
- **Admin SDK**: `firebase-admin` for server-side token verification
- **Auth Flow**: Google popup authentication with `browserLocalPersistence`
- **Token Verification**: Backend middleware verifies Firebase ID tokens on protected routes

#### Key Files:
- `client/src/lib/firebase.ts` - Firebase SDK configuration and auth functions
- `client/src/hooks/useAuth.ts` - React hook for auth state management
- `client/src/pages/Landing.tsx` - Login page with Google sign-in button
- `server/firebaseAuth.ts` - Firebase Admin SDK setup and token verification

#### Required Environment Variables:
- `VITE_FIREBASE_API_KEY` - Firebase API key (client-side)
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID (client-side)
- `VITE_FIREBASE_APP_ID` - Firebase app ID (client-side)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID (client-side)
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase measurement ID (client-side)
- `FIREBASE_ADMIN_PRIVATE_KEY` - Firebase Admin private key (secret)
- `FIREBASE_CLIENT_EMAIL` - Firebase Admin client email (secret)

#### Firebase Console Setup:
The app domain must be added to Firebase Authentication → Authorized domains for Google sign-in to work.

### Development Tools
- Replit-specific Vite plugins for development experience
- Custom meta images plugin for OpenGraph tags
- TypeScript with strict mode enabled