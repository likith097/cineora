# CINEORA

**Every Story Starts Here.**

CINEORA is a Netflix-inspired movie discovery platform built with React, TypeScript, and the TMDB API. It features personalized recommendations, advanced movie filtering, trailers, and a persistent watchlist.

**[Live Demo](https://cineora-movies.vercel.app/)** | **[GitHub Repository](https://github.com/likith097/cineora)**

## Features

- **Trending Movies:** Dynamic homepage carousel featuring trending titles.
- **Movie Discovery:** Explore popular and top-rated movies.
- **Advanced Filters:** Filter movies by genre, release year, and minimum rating, with sorting options.
- **Movie Search:** Search for movies by title.
- **Personalized Recommendations:** Discover movies based on titles saved to your watchlist.
- **Watchlist:** Save and remove movies with browser-based persistence.
- **Movie Details and Trailers:** View additional movie information and available trailers.
- **Responsive Design:** Optimized for desktop and mobile screens.

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Vercel Serverless Functions |
| API | TMDB API |
| Styling | CSS |
| Icons | Lucide React |
| Deployment | Vercel |
| Version Control | Git, GitHub |

## Architecture

CINEORA uses a React frontend that communicates with a serverless API proxy hosted on Vercel.

The backend retrieves movie information from TMDB using a server-side API token. This keeps the token out of the frontend application.

Watchlist data is stored in the browser using localStorage. Personalized recommendations are generated using TMDB recommendation and similar-movie endpoints.

## Getting Started

### Prerequisites

- Node.js and npm
- A TMDB API Read Access Token

### Installation

Clone the repository:

```bash
git clone https://github.com/likith097/cineora.git
cd cineora
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
TMDB_READ_TOKEN=your_tmdb_read_access_token
```

Run the application locally using Vercel CLI:

```bash
npx vercel dev
```

Open `http://localhost:3000`.

## Deployment

CINEORA is deployed on Vercel with a Vite frontend and serverless API functions.

Configure the `TMDB_READ_TOKEN` environment variable in Vercel before deploying.

## Future Improvements

- User authentication and cloud-synced watchlists
- More advanced recommendation preferences
- Improved accessibility and automated testing
- Additional discovery and personalization features

## Disclaimer

This project is an independent portfolio application and is not affiliated with Netflix.

Movie data is provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.

## Author

**Likith Kumar**

[GitHub](https://github.com/likith097)
