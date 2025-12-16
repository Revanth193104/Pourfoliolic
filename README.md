# Pourfoliolic 🍷

Your personal drink tasting journal. Log wines, beers, spirits, and cocktails with detailed tasting notes, ratings, and discover what you love.

**Live App:** [pourfoliolic.com](https://pourfoliolic.com)

## Features

✨ **Drink Logging**
- Log wines, beers, spirits, and cocktails with detailed information
- Capture tasting notes (nose, palate, finish)
- Add ratings, pricing, and purchase location
- Track where you bought your favorite drinks

📊 **Dashboard & Analytics**
- View statistics on your tasting history
- See your most-logged drink types
- Track favorite producers and brands
- Insights based on your collection

🌍 **Community Features**
- Follow other users to see their tastings
- Follow request approval system
- Like (cheer) and comment on drinks
- Activity feed to discover new experiences
- Direct messaging with mutual followers
- Tasting circles for private groups

🎨 **Theme & Customization**
- Light and dark modes
- Customizable dashboard
- Wine-inspired visual design

📱 **Mobile & Offline**
- Installable on iOS and Android as a Progressive Web App
- Works offline with service worker caching
- Full app experience without app store installation

💾 **Data Management**
- Export your tasting history as CSV
- Secure authentication with Google Sign-in
- Data privacy controls

## Quick Start

### For Users
1. Visit [pourfoliolic.com](https://pourfoliolic.com)
2. Sign in with Google or create an account
3. Start logging your drinks!

### To Install as App
**On iPhone (Safari):**
- Open pourfoliolic.com
- Tap Share → Add to Home Screen

**On Android (Chrome):**
- Open pourfoliolic.com
- Tap menu (⋮) → Install app

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS + shadcn/ui
- Vite build tool
- Wouter for routing
- TanStack React Query for state

**Backend**
- Node.js + Express
- TypeScript
- PostgreSQL database
- Drizzle ORM
- Firebase Authentication

**Deployment**
- Hosted on Replit
- Custom domain via Replit DNS
- Progressive Web App (PWA)

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL (included with Replit)

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database
```bash
# Run migrations
npm run db:push
```

## Project Structure
```
pourfoliolic/
├── client/           # React frontend
│   └── src/
│       ├── pages/    # Page components
│       ├── components/
│       └── lib/      # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API endpoints
│   └── storage.ts    # Database layer
├── shared/           # Shared schemas
│   └── schema.ts     # Data models
└── public/           # Static assets
```

## Key Features Explained

### Drink Logging
Add comprehensive details about each drink you taste:
- Basic info: name, maker, type, ABV
- Ratings: overall, appearance, nose, palate, finish
- Tasting notes and personal observations
- Price and purchase venue
- Pairing recommendations

### Community
- **Follows**: Request to follow users, accept/decline requests
- **Cheers**: Like other users' drinks
- **Comments**: Share thoughts on tastings
- **Messages**: Chat with mutual followers
- **Tasting Circles**: Private groups for shared tastings

### Analytics
Track your tasting preferences:
- Total tastings logged
- Average rating
- Most-logged drink type
- Favorite producers
- Spending patterns

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Copyright © 2025 Revanth193104**

## Support

Have questions? Issues? Features to suggest?
- Create an issue on GitHub
- Visit pourfoliolic.com

---

Built with ❤️ for drink enthusiasts everywhere 🍇
