
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/* ==========================================
   CINEORA V5 — TMDB API PROXY
   ========================================== */

const allowedEndpoints = new Set([
  'trending/movie/week',
  'movie/popular',
  'movie/top_rated',
  'movie/now_playing',
  'genre/movie/list',
  'search/movie',
  'discover/movie',
]);

const allowedParameters = new Set([
  'query',
  'page',
  'with_genres',
  'primary_release_year',
  'vote_average.gte',
  'vote_count.gte',
  'sort_by',
  'include_adult',
  'include_video',
]);

const allowedSortOptions = new Set([
  'popularity.desc',
  'vote_average.desc',
  'primary_release_date.desc',
  'primary_release_date.asc',
]);

/* ==========================================
   READ TMDB TOKEN
   ========================================== */

function getToken(): string | undefined {
  if (process.env.TMDB_READ_TOKEN) {
    return process.env.TMDB_READ_TOKEN;
  }

  const envPath = resolve(process.cwd(), '.env.local');

  if (existsSync(envPath)) {
    const contents = readFileSync(envPath, 'utf8');

    const match = contents.match(
      /^TMDB_READ_TOKEN=(.*)$/m
    );

    if (match) {
      return match[1]
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }

  return undefined;
}

/* ==========================================
   VALIDATE ENDPOINT
   ========================================== */

function isAllowedEndpoint(path: string): boolean {
  if (allowedEndpoints.has(path)) {
    return true;
  }

  // Supports:
  // movie/12345
  // movie/12345/videos
  // movie/12345/recommendations
  // movie/12345/similar

  return /^movie\/\d+(\/(videos|recommendations|similar))?$/.test(
    path
  );
}

/* ==========================================
   API HANDLER
   ========================================== */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  /* ALLOW GET REQUESTS ONLY */

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  /* VALIDATE REQUESTED PATH */

  const path =
    typeof req.query.path === 'string'
      ? req.query.path
      : '';

  if (!isAllowedEndpoint(path)) {
    return res.status(400).json({
      error: 'Unsupported endpoint',
    });
  }

  /* GET API TOKEN */

  const token = getToken();

  if (!token) {
    return res.status(503).json({
      error: 'TMDB_READ_TOKEN is not configured',
    });
  }

  /* BUILD TMDB URL */

  const url = new URL(
    `https://api.themoviedb.org/3/${path}`
  );

  /* FORWARD SUPPORTED QUERY PARAMETERS */

  for (const key of allowedParameters) {
    const value = req.query[key];

    if (typeof value !== 'string') {
      continue;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      continue;
    }

    // Validate sorting values.

    if (
      key === 'sort_by' &&
      !allowedSortOptions.has(trimmedValue)
    ) {
      return res.status(400).json({
        error: 'Invalid sort option',
      });
    }

    // Validate pagination.

    if (key === 'page') {
      const page = Number(trimmedValue);

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > 500
      ) {
        return res.status(400).json({
          error: 'Invalid page number',
        });
      }
    }

    // Validate year.

    if (key === 'primary_release_year') {
      const year = Number(trimmedValue);

      if (
        !Number.isInteger(year) ||
        year < 1870 ||
        year > 2100
      ) {
        return res.status(400).json({
          error: 'Invalid release year',
        });
      }
    }

    // Validate rating.

    if (key === 'vote_average.gte') {
      const rating = Number(trimmedValue);

      if (
        !Number.isFinite(rating) ||
        rating < 0 ||
        rating > 10
      ) {
        return res.status(400).json({
          error: 'Invalid minimum rating',
        });
      }
    }

    // Validate minimum vote count.

    if (key === 'vote_count.gte') {
      const voteCount = Number(trimmedValue);

      if (
        !Number.isInteger(voteCount) ||
        voteCount < 0
      ) {
        return res.status(400).json({
          error: 'Invalid vote count',
        });
      }
    }

    // Validate genre IDs.

    if (
      key === 'with_genres' &&
      !/^\d+(,\d+)*$/.test(trimmedValue)
    ) {
      return res.status(400).json({
        error: 'Invalid genre selection',
      });
    }

    // Forward safe, supported parameters.

    url.searchParams.set(
      key,
      trimmedValue.slice(0, 150)
    );
  }

  /* FORCE SAFE DEFAULTS */

  url.searchParams.set('language', 'en-US');
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('include_video', 'false');

  /* CALL TMDB */

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        accept: 'application/json',
      },
    });

    const data = await response.json();

    /* CACHE SUCCESSFUL RESULTS */

    if (response.ok) {
      res.setHeader(
        'Cache-Control',
        's-maxage=300, stale-while-revalidate=600'
      );
    } else {
      res.setHeader(
        'Cache-Control',
        'no-store'
      );
    }

    return res.status(response.status).json(data);
  } catch {
    return res.status(502).json({
      error: 'Unable to reach movie service',
    });
  }
}
