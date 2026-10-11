# CINEORA — Every Story Starts Here

A responsive movie discovery app built with React, TypeScript, Vite and TMDB. Graphite Red visual identity.

## Features
- Cinematic featured movie hero
- Trending, popular and top-rated movie collections
- Search with debounce and genre filtering
- Movie details and embedded YouTube trailers
- Personal watchlist saved in browser localStorage
- Responsive desktop/mobile layout
- TMDB API token stays on the server (Vercel function in production, Vite proxy in development)

## Run locally
1. Install Node.js 20+.
2. Create a TMDB account and request an API Read Access Token at https://www.themoviedb.org/settings/api .
3. Copy `.env.example` to `.env` and set `TMDB_READ_TOKEN`.
4. Run `npm install`.
5. Run `npm run dev` and open the local URL shown in your terminal.

## Deploy on GitHub + Vercel
1. Create an empty GitHub repository called `cineora`.
2. From this project directory run:
   ```bash
   git init
   git add .
   git commit -m "Build CINEORA v1"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/cineora.git
   git push -u origin main
   ```
3. In Vercel, import the GitHub repository. Select **Vite** as framework. Keep build command `npm run build` and output directory `dist`.
4. Add the environment variable `TMDB_READ_TOKEN` in Vercel project settings, with your TMDB API Read Access Token. Do **not** prefix it with `VITE_`.
5. Deploy. Vercel will serve the frontend and `/api/tmdb` serverless function.

## Notes
- TMDB attribution is in the site footer. Review TMDB's terms and logo attribution requirements before public launch: https://developer.themoviedb.org/docs/faq .
- This is a movie discovery platform, not a licensed full-movie streaming service.
- Watchlist is per browser/device, not synced across accounts.
- TMDB API access and Vercel Hobby plan are subject to their respective terms and limits.
