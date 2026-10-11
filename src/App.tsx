
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bookmark,
  Play,
  Plus,
  Check,
  X,
  Star,
  ArrowRight,
  Clapperboard,
  Menu,
  Film,
  ChevronLeft,
  ChevronRight,
  Eye,
  CalendarDays,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  Sparkles,
  Heart,
  WandSparkles,
  RefreshCw,
} from 'lucide-react';

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  runtime?: number;
  genres?: { id: number; name: string }[];
};

type Genre = {
  id: number;
  name: string;
};

type Results = {
  results: Movie[];
  total_pages?: number;
};

type View = 'home' | 'discover' | 'for-you' | 'watchlist';

type SortOption =
  | 'popularity.desc'
  | 'vote_average.desc'
  | 'primary_release_date.desc'
  | 'primary_release_date.asc';

type RecommendationGroup = {
  source: Movie;
  movies: Movie[];
};

const img = (path: string | null, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '';

async function api<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<T> {
  const query = new URLSearchParams({ path, ...params });
  const response = await fetch(`/api/tmdb?${query}`);

  if (!response.ok) {
    throw new Error(
      'Movie service unavailable. Check your TMDB token and deployment configuration.'
    );
  }

  return response.json();
}

/* ==========================================
   PERSISTENT WATCHLIST
   ========================================== */

function useWatchlist() {
  const [ids, setIds] = useState<number[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem('cineora-watchlist') || '[]'
      );
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  });

  const [saved, setSaved] = useState<Movie[]>(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem('cineora-movies') || '[]'
      );
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  });

  const toggle = (movie: Movie) => {
    if (ids.includes(movie.id)) {
      setIds((previous) =>
        previous.filter((id) => id !== movie.id)
      );

      setSaved((previous) =>
        previous.filter((item) => item.id !== movie.id)
      );
    } else {
      setIds((previous) => [...previous, movie.id]);

      setSaved((previous) => [
        movie,
        ...previous.filter((item) => item.id !== movie.id),
      ]);
    }
  };

  useEffect(() => {
    localStorage.setItem(
      'cineora-watchlist',
      JSON.stringify(ids)
    );

    localStorage.setItem(
      'cineora-movies',
      JSON.stringify(saved)
    );
  }, [ids, saved]);

  return { ids, saved, toggle };
}

/* ==========================================
   INTERACTIVE MOVIE CARD
   ========================================== */

function Poster({
  movie,
  onOpen,
  onToggle,
  saved,
}: {
  movie: Movie;
  onOpen: (movie: Movie) => void;
  onToggle: (movie: Movie) => void;
  saved: boolean;
}) {
  const year = movie.release_date?.slice(0, 4) || 'TBA';

  const rating =
    typeof movie.vote_average === 'number' &&
    movie.vote_average > 0
      ? movie.vote_average.toFixed(1)
      : 'N/A';

  return (
    <article className="poster">
      <div className="poster-image">
        {movie.poster_path ? (
          <img
            src={img(movie.poster_path)}
            alt={`${movie.title} poster`}
            loading="lazy"
          />
        ) : (
          <div className="poster-fallback">
            <Film size={42} />
          </div>
        )}

        <div className="poster-rating">
          <Star size={12} fill="currentColor" />
          {rating}
        </div>

        <button
          type="button"
          className={`poster-save ${saved ? 'is-saved' : ''}`}
          aria-label={
            saved
              ? `Remove ${movie.title} from watchlist`
              : `Add ${movie.title} to watchlist`
          }
          title={
            saved
              ? 'Remove from watchlist'
              : 'Add to watchlist'
          }
          onClick={() => onToggle(movie)}
        >
          {saved ? <Check size={17} /> : <Plus size={17} />}
        </button>

        <div className="poster-overlay">
          <div className="poster-overlay-content">
            <p className="poster-overlay-label">
              DISCOVER THE STORY
            </p>

            <h4>{movie.title}</h4>

            <div className="poster-overlay-meta">
              <span>
                <CalendarDays size={13} />
                {year}
              </span>

              <span>
                <Star size={13} fill="currentColor" />
                {rating}
              </span>
            </div>

            <button
              type="button"
              className="poster-view-btn"
              onClick={() => onOpen(movie)}
            >
              <Eye size={16} />
              View Details
            </button>
          </div>
        </div>
      </div>

      <div className="poster-info">
        <button
          type="button"
          className="poster-title-button"
          onClick={() => onOpen(movie)}
          title={`View ${movie.title}`}
        >
          {movie.title}
        </button>

        <div className="poster-meta">
          <span>{year}</span>

          <span>
            <Star size={12} fill="currentColor" />
            {rating}
          </span>
        </div>

        <button
          type="button"
          className="poster-mobile-details"
          onClick={() => onOpen(movie)}
        >
          View Details
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

/* ==========================================
   MAIN APPLICATION
   ========================================== */

export default function App() {
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [top, setTop] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [view, setView] = useState<View>('home');
  const [detail, setDetail] = useState<Movie | null>(null);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  /* V5 — ADVANCED FILTERS */

  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minimumRating, setMinimumRating] = useState('0');

  const [sortBy, setSortBy] = useState<SortOption>(
    'popularity.desc'
  );

  const [discoverMovies, setDiscoverMovies] = useState<Movie[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [discoverPage, setDiscoverPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  /* V6 — PERSONALIZED RECOMMENDATIONS */

  const [recommendationGroups, setRecommendationGroups] =
    useState<RecommendationGroup[]>([]);

  const [recommendationsLoading, setRecommendationsLoading] =
    useState(false);

  const [recommendationsError, setRecommendationsError] =
    useState('');

  const [recommendationsRevision, setRecommendationsRevision] =
    useState(0);

  const { ids, saved, toggle } = useWatchlist();

  /* INITIAL HOMEPAGE DATA */

  useEffect(() => {
    let alive = true;

    Promise.all([
      api<Results>('trending/movie/week'),
      api<Results>('movie/popular'),
      api<Results>('movie/top_rated'),
      api<{ genres: Genre[] }>('genre/movie/list'),
    ])
      .then(([trendingData, popularData, topData, genreData]) => {
        if (!alive) return;

        setTrending(trendingData.results);
        setPopular(popularData.results);
        setTop(topData.results);
        setGenres(genreData.genres);
      })
      .catch((requestError) => {
        if (alive) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  /* V5 — DISCOVER QUERY PARAMETERS */

  const buildDiscoverParams = useCallback(
    (page: number): Record<string, string> => {
      const params: Record<string, string> = {
        sort_by: sortBy,
        page: String(page),
        include_adult: 'false',
        include_video: 'false',
      };

      if (selectedGenre) {
        params.with_genres = selectedGenre;
      }

      if (selectedYear) {
        params.primary_release_year = selectedYear;
      }

      if (Number(minimumRating) > 0) {
        params['vote_average.gte'] = minimumRating;
        params['vote_count.gte'] = '50';
      }

      return params;
    },
    [selectedGenre, selectedYear, minimumRating, sortBy]
  );

  /* V5 — FETCH FILTERED MOVIES */

  useEffect(() => {
    let alive = true;

    setDiscoverLoading(true);
    setDiscoverError('');
    setDiscoverPage(1);
    setTotalPages(1);
    setDiscoverMovies([]);

    api<Results>('discover/movie', buildDiscoverParams(1))
      .then((result) => {
        if (!alive) return;

        setDiscoverMovies(result.results);
        setTotalPages(
          Math.min(result.total_pages || 1, 500)
        );
      })
      .catch(() => {
        if (alive) {
          setDiscoverError(
            'Unable to load movies. Please try again.'
          );
        }
      })
      .finally(() => {
        if (alive) {
          setDiscoverLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [buildDiscoverParams]);

  /* V5 — LOAD MORE */

  const loadMoreMovies = async () => {
    if (
      loadingMore ||
      discoverLoading ||
      discoverPage >= totalPages
    ) {
      return;
    }

    const nextPage = discoverPage + 1;

    setLoadingMore(true);
    setDiscoverError('');

    try {
      const result = await api<Results>(
        'discover/movie',
        buildDiscoverParams(nextPage)
      );

      setDiscoverMovies((previous) => {
        const existingIds = new Set(
          previous.map((movie) => movie.id)
        );

        return [
          ...previous,
          ...result.results.filter(
            (movie) => !existingIds.has(movie.id)
          ),
        ];
      });

      setDiscoverPage(nextPage);
    } catch {
      setDiscoverError(
        'Could not load more movies. Please try again.'
      );
    } finally {
      setLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setSelectedGenre('');
    setSelectedYear('');
    setMinimumRating('0');
    setSortBy('popularity.desc');
  };

  const activeFilterCount = [
    selectedGenre !== '',
    selectedYear !== '',
    minimumRating !== '0',
    sortBy !== 'popularity.desc',
  ].filter(Boolean).length;

  /* MOVIE SEARCH */

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    let alive = true;

    setSearchLoading(true);
    setSearchResults([]);

    const timer = window.setTimeout(() => {
      api<Results>('search/movie', {
        query: query.trim(),
      })
        .then((result) => {
          if (alive) {
            setSearchResults(result.results);
          }
        })
        .catch(() => {
          if (alive) {
            setSearchResults([]);
          }
        })
        .finally(() => {
          if (alive) {
            setSearchLoading(false);
          }
        });
    }, 350);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  /* MOVIE DETAILS AND TRAILER */

  const openDetail = useCallback(async (movie: Movie) => {
    setDetail(movie);
    setTrailer(null);
    setTrailerLoading(true);

    try {
      const [details, videos] = await Promise.all([
        api<Movie>(`movie/${movie.id}`),
        api<{
          results: {
            site: string;
            type: string;
            key: string;
          }[];
        }>(`movie/${movie.id}/videos`),
      ]);

      setDetail((current) =>
        current?.id === movie.id ? details : current
      );

      const selectedTrailer =
        videos.results.find(
          (video) =>
            video.site === 'YouTube' &&
            video.type === 'Trailer'
        ) ||
        videos.results.find(
          (video) =>
            video.site === 'YouTube' &&
            video.type === 'Teaser'
        );

      setTrailer((current) => {
        void current;
        return selectedTrailer?.key || null;
      });
    } catch {
      // Basic movie details remain available.
    } finally {
      setTrailerLoading(false);
    }
  }, []);

  /* V6 — WATCHLIST-BASED RECOMMENDATIONS */

  const recommendationSources = useMemo(
    () => saved.slice(0, 4),
    [saved]
  );

  const recommendationSourceKey = recommendationSources
    .map((movie) => movie.id)
    .join(',');

  useEffect(() => {
    let alive = true;

    if (recommendationSources.length === 0) {
      setRecommendationGroups([]);
      setRecommendationsLoading(false);
      setRecommendationsError('');
      return;
    }

    setRecommendationsLoading(true);
    setRecommendationsError('');

    const excludedIds = new Set(ids);

    async function loadRecommendations() {
      const results = await Promise.allSettled(
        recommendationSources.map(async (source) => {
          const recommended = await api<Results>(
            `movie/${source.id}/recommendations`
          );

          let movies = recommended.results;

          // TMDB can have no direct recommendations
          // for less popular or newer movies.
          if (movies.length === 0) {
            const similar = await api<Results>(
              `movie/${source.id}/similar`
            );

            movies = similar.results;
          }

          return {
            source,
            movies: movies.filter(
              (movie) =>
                movie.poster_path &&
                !excludedIds.has(movie.id) &&
                movie.id !== source.id
            ),
          };
        })
      );

      if (!alive) return;

      const successfulGroups = results
        .filter(
          (
            result
          ): result is PromiseFulfilledResult<RecommendationGroup> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value)
        .filter((group) => group.movies.length > 0);

      setRecommendationGroups(successfulGroups);

      if (
        successfulGroups.length === 0 &&
        results.some((result) => result.status === 'rejected')
      ) {
        setRecommendationsError(
          'Recommendations are temporarily unavailable.'
        );
      }

      setRecommendationsLoading(false);
    }

    void loadRecommendations();

    return () => {
      alive = false;
    };
  }, [
    recommendationSourceKey,
    recommendationsRevision,
  ]);

  /* V6 — COMBINED PERSONALIZED COLLECTION */

  const personalizedMovies = useMemo(() => {
    const savedIds = new Set(ids);
    const unique = new Map<number, Movie>();

    recommendationGroups.forEach((group, groupIndex) => {
      group.movies.forEach((movie, movieIndex) => {
        if (!savedIds.has(movie.id) && !unique.has(movie.id)) {
          unique.set(movie.id, movie);
        }

        void groupIndex;
        void movieIndex;
      });
    });

    return Array.from(unique.values());
  }, [recommendationGroups, ids]);

  /* V6 — FALLBACK DISCOVERY */

  const fallbackMovies = useMemo(() => {
    const unique = new Map<number, Movie>();

    [...top, ...trending, ...popular].forEach((movie) => {
      if (movie.poster_path && !unique.has(movie.id)) {
        unique.set(movie.id, movie);
      }
    });

    return Array.from(unique.values()).slice(0, 24);
  }, [top, trending, popular]);

  const refreshRecommendations = () => {
    setRecommendationsRevision((current) => current + 1);
  };

  /* FEATURED MOVIE CAROUSEL */

  const featuredMovies = useMemo(
    () =>
      trending
        .filter(
          (movie) =>
            movie.backdrop_path &&
            movie.overview &&
            movie.title
        )
        .slice(0, 5),
    [trending]
  );

  const nextFeatured = useCallback(() => {
    setFeaturedIndex(
      (current) =>
        (current + 1) % Math.max(featuredMovies.length, 1)
    );
  }, [featuredMovies.length]);

  const previousFeatured = useCallback(() => {
    setFeaturedIndex(
      (current) =>
        (current - 1 + featuredMovies.length) %
        Math.max(featuredMovies.length, 1)
    );
  }, [featuredMovies.length]);

  useEffect(() => {
    if (
      view !== 'home' ||
      detail !== null ||
      featuredMovies.length < 2
    ) {
      return;
    }

    const interval = window.setInterval(nextFeatured, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    view,
    detail,
    featuredMovies.length,
    nextFeatured,
  ]);

  const hero =
    featuredMovies[featuredIndex] || trending[0];

  const navigate = (page: View) => {
    setView(page);
    setMobileNav(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* REUSABLE MOVIE ROW */

  const row = (
    title: string,
    movies: Movie[],
    subtitle = 'CURATED FOR YOU'
  ) => (
    <section className="movie-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{subtitle}</p>
          <h2>{title}</h2>
        </div>

        <button
          className="text-button"
          onClick={() => navigate('discover')}
        >
          Explore all
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="movie-scroll">
        {movies.slice(0, 12).map((movie) => (
          <Poster
            key={movie.id}
            movie={movie}
            saved={ids.includes(movie.id)}
            onOpen={openDetail}
            onToggle={toggle}
          />
        ))}
      </div>
    </section>
  );

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, index) => String(currentYear - index)
  );

  const isSearching = query.trim().length > 0;

  const visibleMovies = isSearching
    ? searchResults
    : discoverMovies;

  const hasSavedMovies = saved.length > 0;

  return (
    <div className="site">
      {/* ==================================
          HEADER
          ================================== */}

      <header className="header">
        <button
          className="brand"
          onClick={() => {
            setQuery('');
            navigate('home');
          }}
        >
          CINE<span>ORA</span><i>.</i>
        </button>

        <nav className={mobileNav ? 'nav open' : 'nav'}>
          <button
            className={view === 'home' ? 'active' : ''}
            onClick={() => navigate('home')}
          >
            Home
          </button>

          <button
            className={view === 'discover' ? 'active' : ''}
            onClick={() => navigate('discover')}
          >
            Discover
          </button>

          <button
            className={view === 'for-you' ? 'active' : ''}
            onClick={() => navigate('for-you')}
          >
            <Sparkles size={14} />
            For You
          </button>

          <button
            className={view === 'watchlist' ? 'active' : ''}
            onClick={() => navigate('watchlist')}
          >
            My Watchlist
          </button>
        </nav>

        <div className="header-actions">
          <div className="search-box">
            <Search size={18} />

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);

                if (event.target.value) {
                  setView('discover');
                }
              }}
              placeholder="Search movies..."
              aria-label="Search movies"
            />
          </div>

          <button
            className="watchlist-icon"
            aria-label="Open watchlist"
            onClick={() => navigate('watchlist')}
          >
            <Bookmark size={19} />
            <span>{ids.length}</span>
          </button>

          <button
            className="menu-icon"
            aria-label="Toggle menu"
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu />
          </button>
        </div>
      </header>

      {/* ==================================
          LOADING AND ERROR
          ================================== */}

      {loading ? (
        <div className="state">
          <div className="spinner" />
          Loading your next story...
        </div>
      ) : error ? (
        <div className="state">
          <Clapperboard size={44} />
          <h2>Lights, camera… almost.</h2>
          <p>{error}</p>
          <p>See README.md for setup instructions.</p>
        </div>
      ) : (
        <>
          {/* ==================================
              HOME
              ================================== */}

          {view === 'home' && (
            <>
              <section
                className="hero"
                style={{
                  backgroundImage: hero?.backdrop_path
                    ? `linear-gradient(
                        90deg,
                        #18191B 4%,
                        rgba(24,25,27,.91) 29%,
                        rgba(24,25,27,.20) 78%
                      ),
                      linear-gradient(
                        0deg,
                        #18191B 1%,
                        transparent 55%
                      ),
                      url(${img(hero.backdrop_path, 'original')})`
                    : undefined,
                }}
              >
                <div className="hero-content">
                  <p className="eyebrow">
                    <span className="red-line" />
                    CINEORA ORIGINAL DISCOVERY
                  </p>

                  <h1 key={hero?.id} className="hero-title">
                    {hero?.title || 'Discover Cinema'}
                  </h1>

                  <div className="hero-metadata">
                    <span className="hero-rating">
                      <Star size={16} fill="currentColor" />
                      {hero?.vote_average?.toFixed(1) ?? '—'}
                    </span>

                    <span>
                      {hero?.release_date?.slice(0, 4) ||
                        'Coming Soon'}
                    </span>

                    <span className="hero-badge">
                      FEATURED MOVIE
                    </span>
                  </div>

                  <p className="hero-description">
                    {hero?.overview ||
                      'Discover extraordinary films and find your next obsession.'}
                  </p>

                  <div className="hero-buttons">
                    <button
                      className="primary-btn"
                      disabled={!hero}
                      onClick={() => {
                        if (hero) openDetail(hero);
                      }}
                    >
                      <Play size={17} fill="currentColor" />
                      Explore Featured
                    </button>

                    <button
                      className="outline-btn"
                      onClick={() => navigate('discover')}
                    >
                      Browse Movies
                      <ArrowRight size={17} />
                    </button>
                  </div>

                  <div className="hero-carousel-controls">
                    <div className="hero-carousel-dots">
                      {featuredMovies.map((movie, index) => (
                        <button
                          key={movie.id}
                          type="button"
                          className={
                            index === featuredIndex
                              ? 'hero-carousel-dot active'
                              : 'hero-carousel-dot'
                          }
                          onClick={() =>
                            setFeaturedIndex(index)
                          }
                          aria-label={`Show ${movie.title}`}
                          aria-current={
                            index === featuredIndex
                              ? 'true'
                              : undefined
                          }
                        />
                      ))}
                    </div>

                    <div className="hero-carousel-arrows">
                      <button
                        type="button"
                        onClick={previousFeatured}
                        disabled={featuredMovies.length < 2}
                        aria-label="Previous featured movie"
                      >
                        <ChevronLeft size={21} />
                      </button>

                      <button
                        type="button"
                        onClick={nextFeatured}
                        disabled={featuredMovies.length < 2}
                        aria-label="Next featured movie"
                      >
                        <ChevronRight size={21} />
                      </button>
                    </div>
                  </div>

                  <div className="hero-carousel-counter">
                    <span>
                      {String(featuredIndex + 1).padStart(
                        2,
                        '0'
                      )}
                    </span>

                    <span className="counter-divider">/</span>

                    <span>
                      {String(
                        Math.max(featuredMovies.length, 1)
                      ).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </section>

              <main className="content">
                {hasSavedMovies && (
                  <section className="personalized-home">
                    <div className="personalized-home-heading">
                      <div>
                        <p className="eyebrow">
                          <Sparkles size={13} />
                          INSPIRED BY YOUR WATCHLIST
                        </p>

                        <h2>
                          Picked Just <em>For You.</em>
                        </h2>

                        <p>
                          Movie recommendations inspired
                          by the stories you saved.
                        </p>
                      </div>

                      <button
                        className="text-button"
                        onClick={() => navigate('for-you')}
                      >
                        See your picks
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    {recommendationsLoading ? (
                      <div className="recommendation-inline-loading">
                        <div className="spinner" />
                        Finding movies you'll love...
                      </div>
                    ) : (
                      <div className="movie-scroll">
                        {(personalizedMovies.length
                          ? personalizedMovies
                          : fallbackMovies
                        )
                          .slice(0, 12)
                          .map((movie) => (
                            <Poster
                              key={movie.id}
                              movie={movie}
                              saved={ids.includes(movie.id)}
                              onOpen={openDetail}
                              onToggle={toggle}
                            />
                          ))}
                      </div>
                    )}
                  </section>
                )}

                {row(
                  'Trending This Week',
                  trending,
                  'WHAT EVERYONE IS WATCHING'
                )}

                {row(
                  'Popular Right Now',
                  popular,
                  'THE CROWD FAVORITES'
                )}

                {row(
                  'Critically Acclaimed',
                  top,
                  'THE BEST OF THE BEST'
                )}

                <section className="banner">
                  <div>
                    <p className="eyebrow">
                      YOUR CINEMA. YOUR RULES.
                    </p>

                    <h2>
                      Great stories deserve
                      <br />
                      a second look.
                    </h2>

                    <p>
                      Keep all your must-watch movies
                      in one place.
                    </p>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={() => navigate('watchlist')}
                  >
                    <Bookmark size={17} />
                    My Watchlist
                  </button>
                </section>
              </main>
            </>
          )}

          {/* ==================================
              V5 — DISCOVER PAGE
              ================================== */}

          {view === 'discover' && (
            <main className="content page">
              <p className="eyebrow">
                EXPLORE THE UNEXPECTED
              </p>

              <h1>
                Discover <em>Movies.</em>
              </h1>

              <p className="page-description">
                Find something worth staying up for.
                Explore cinema on your terms.
              </p>

              <section
                className="filter-panel"
                aria-label="Movie discovery filters"
              >
                <div className="filter-panel-header">
                  <div className="filter-panel-title">
                    <span className="filter-icon">
                      <SlidersHorizontal size={19} />
                    </span>

                    <div>
                      <h2>Refine Your Discovery</h2>
                      <p>
                        Find exactly the kind of story
                        you're looking for.
                      </p>
                    </div>
                  </div>

                  <button
                    className="filter-reset"
                    type="button"
                    onClick={resetFilters}
                    disabled={activeFilterCount === 0}
                  >
                    <RotateCcw size={15} />
                    Reset Filters
                  </button>
                </div>

                <div className="filter-grid">
                  <div className="filter-field">
                    <label htmlFor="genre-filter">
                      GENRE
                    </label>

                    <div className="filter-select-wrap">
                      <select
                        id="genre-filter"
                        value={selectedGenre}
                        onChange={(event) =>
                          setSelectedGenre(
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          All Genres
                        </option>

                        {genres.map((genre) => (
                          <option
                            key={genre.id}
                            value={genre.id}
                          >
                            {genre.name}
                          </option>
                        ))}
                      </select>

                      <ChevronDown size={16} />
                    </div>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="year-filter">
                      RELEASE YEAR
                    </label>

                    <div className="filter-select-wrap">
                      <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(event) =>
                          setSelectedYear(
                            event.target.value
                          )
                        }
                      >
                        <option value="">
                          Any Year
                        </option>

                        {years.map((year) => (
                          <option
                            key={year}
                            value={year}
                          >
                            {year}
                          </option>
                        ))}
                      </select>

                      <ChevronDown size={16} />
                    </div>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="rating-filter">
                      MINIMUM RATING
                    </label>

                    <div className="filter-select-wrap">
                      <select
                        id="rating-filter"
                        value={minimumRating}
                        onChange={(event) =>
                          setMinimumRating(
                            event.target.value
                          )
                        }
                      >
                        <option value="0">
                          Any Rating
                        </option>

                        <option value="6">
                          6.0+ Good
                        </option>

                        <option value="7">
                          7.0+ Great
                        </option>

                        <option value="8">
                          8.0+ Excellent
                        </option>

                        <option value="9">
                          9.0+ Exceptional
                        </option>
                      </select>

                      <ChevronDown size={16} />
                    </div>
                  </div>

                  <div className="filter-field">
                    <label htmlFor="sort-filter">
                      SORT BY
                    </label>

                    <div className="filter-select-wrap">
                      <select
                        id="sort-filter"
                        value={sortBy}
                        onChange={(event) =>
                          setSortBy(
                            event.target.value as SortOption
                          )
                        }
                      >
                        <option value="popularity.desc">
                          Most Popular
                        </option>

                        <option value="vote_average.desc">
                          Highest Rated
                        </option>

                        <option value="primary_release_date.desc">
                          Newest First
                        </option>

                        <option value="primary_release_date.asc">
                          Oldest First
                        </option>
                      </select>

                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div className="filter-panel-bottom">
                  <span className="filter-status">
                    <span className="filter-status-dot" />
                    {activeFilterCount === 0
                      ? 'Browsing all movies'
                      : `${activeFilterCount} active ${
                          activeFilterCount === 1
                            ? 'filter'
                            : 'filters'
                        }`}
                  </span>

                  <span className="filter-powered">
                    POWERED BY TMDB
                  </span>
                </div>
              </section>

              <div className="discover-results-header">
                <div>
                  <p className="eyebrow">
                    {isSearching
                      ? 'YOUR SEARCH RESULTS'
                      : 'HANDPICKED BY YOUR FILTERS'}
                  </p>

                  <h2>
                    {isSearching
                      ? `Results for “${query.trim()}”`
                      : 'Explore the Collection'}
                  </h2>
                </div>

                {!isSearching && !discoverLoading && (
                  <span className="results-count">
                    {discoverMovies.length} movies loaded
                  </span>
                )}
              </div>

              {(isSearching
                ? searchLoading
                : discoverLoading) ? (
                <div className="discover-loading">
                  <div className="spinner" />
                  Finding your next favorite...
                </div>
              ) : (
                <>
                  <div className="movie-grid">
                    {visibleMovies.map((movie) => (
                      <Poster
                        key={movie.id}
                        movie={movie}
                        onOpen={openDetail}
                        onToggle={toggle}
                        saved={ids.includes(movie.id)}
                      />
                    ))}
                  </div>

                  {visibleMovies.length === 0 && (
                    <div className="discover-empty">
                      <Search size={35} />
                      <h3>No movies found</h3>

                      <p>
                        {isSearching
                          ? 'Try searching for another title.'
                          : 'Try adjusting your filters to discover more movies.'}
                      </p>

                      {!isSearching && (
                        <button
                          className="outline-btn"
                          onClick={resetFilters}
                        >
                          <RotateCcw size={16} />
                          Reset Filters
                        </button>
                      )}
                    </div>
                  )}

                  {discoverError && !isSearching && (
                    <p className="discover-error">
                      {discoverError}
                    </p>
                  )}

                  {!isSearching &&
                    discoverMovies.length > 0 &&
                    discoverPage < totalPages && (
                      <div className="load-more-wrap">
                        <button
                          className="load-more-btn"
                          type="button"
                          disabled={loadingMore}
                          onClick={loadMoreMovies}
                        >
                          {loadingMore
                            ? 'Loading Movies...'
                            : 'Load More Movies'}

                          {!loadingMore && (
                            <ArrowRight size={17} />
                          )}
                        </button>
                      </div>
                    )}
                </>
              )}
            </main>
          )}

          {/* ==================================
              V6 — FOR YOU PAGE
              ================================== */}

          {view === 'for-you' && (
            <main className="content page for-you-page">
              <div className="for-you-intro">
                <p className="eyebrow">
                  <Sparkles size={14} />
                  YOUR PERSONAL CINEMA
                </p>

                <h1>
                  Made <em>For You.</em>
                </h1>

                <p className="page-description">
                  Great movies lead to more great movies.
                  Discover what to watch next based on
                  the stories you love.
                </p>
              </div>

              <section className="taste-banner">
                <div className="taste-icon">
                  <WandSparkles size={27} />
                </div>

                <div className="taste-copy">
                  <p className="eyebrow">
                    YOUR MOVIE TASTE
                  </p>

                  <h2>
                    {hasSavedMovies
                      ? `Inspired by ${saved.length} saved ${
                          saved.length === 1
                            ? 'movie'
                            : 'movies'
                        }`
                      : 'Your next favorite is waiting'}
                  </h2>

                  <p>
                    {hasSavedMovies
                      ? 'Recommendations are generated from the movies in your watchlist.'
                      : 'Save a few movies to unlock personalized recommendations.'}
                  </p>
                </div>

                {hasSavedMovies && (
                  <button
                    className="recommendation-refresh"
                    type="button"
                    onClick={refreshRecommendations}
                    disabled={recommendationsLoading}
                  >
                    <RefreshCw
                      size={16}
                      className={
                        recommendationsLoading
                          ? 'spinning'
                          : ''
                      }
                    />
                    Refresh
                  </button>
                )}
              </section>

              {recommendationsLoading ? (
                <div className="recommendations-loading">
                  <div className="spinner" />
                  <h3>Finding your next favorites...</h3>
                  <p>
                    Exploring movies related to your watchlist.
                  </p>
                </div>
              ) : (
                <>
                  {hasSavedMovies &&
                    personalizedMovies.length > 0 && (
                      <section className="recommendation-featured">
                        <div className="section-heading">
                          <div>
                            <p className="eyebrow">
                              <Heart
                                size={13}
                                fill="currentColor"
                              />
                              YOUR PERSONALIZED PICKS
                            </p>

                            <h2>
                              Recommended For You
                            </h2>
                          </div>

                          <span className="results-count">
                            {personalizedMovies.length} suggestions
                          </span>
                        </div>

                        <div className="movie-grid">
                          {personalizedMovies
                            .slice(0, 12)
                            .map((movie) => (
                              <Poster
                                key={movie.id}
                                movie={movie}
                                onOpen={openDetail}
                                onToggle={toggle}
                                saved={ids.includes(movie.id)}
                              />
                            ))}
                        </div>
                      </section>
                    )}

                  {recommendationGroups.map((group) => (
                    <section
                      className="movie-section recommendation-group"
                      key={group.source.id}
                    >
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">
                            BECAUSE YOU SAVED
                          </p>

                          <h2>
                            More Like{' '}
                            <span className="recommendation-source-title">
                              {group.source.title}
                            </span>
                          </h2>
                        </div>
                      </div>

                      <div className="movie-scroll">
                        {group.movies
                          .slice(0, 12)
                          .map((movie) => (
                            <Poster
                              key={movie.id}
                              movie={movie}
                              onOpen={openDetail}
                              onToggle={toggle}
                              saved={ids.includes(movie.id)}
                            />
                          ))}
                      </div>
                    </section>
                  ))}

                  {(!hasSavedMovies ||
                    personalizedMovies.length === 0) && (
                    <section className="recommendation-empty">
                      <div className="recommendation-empty-icon">
                        <Sparkles size={30} />
                      </div>

                      <h2>
                        {hasSavedMovies
                          ? 'Discover more stories'
                          : 'Let’s find your movie taste.'}
                      </h2>

                      <p>
                        {hasSavedMovies
                          ? 'We could not find direct recommendations for your saved movies right now. Explore these highly rated and trending films instead.'
                          : 'Start by adding a few movies to your watchlist. We’ll use them to suggest similar titles.'}
                      </p>

                      {recommendationsError && (
                        <p className="recommendation-error">
                          {recommendationsError}
                        </p>
                      )}

                      <button
                        className="primary-btn"
                        onClick={() => navigate('discover')}
                      >
                        <Film size={17} />
                        Explore Movies
                        <ArrowRight size={17} />
                      </button>
                    </section>
                  )}

                  {(!hasSavedMovies ||
                    personalizedMovies.length === 0) &&
                    fallbackMovies.length > 0 && (
                      <section className="movie-section">
                        <div className="section-heading">
                          <div>
                            <p className="eyebrow">
                              A GREAT PLACE TO START
                            </p>

                            <h2>
                              Explore Popular Favorites
                            </h2>
                          </div>
                        </div>

                        <div className="movie-grid">
                          {fallbackMovies
                            .slice(0, 12)
                            .map((movie) => (
                              <Poster
                                key={movie.id}
                                movie={movie}
                                onOpen={openDetail}
                                onToggle={toggle}
                                saved={ids.includes(movie.id)}
                              />
                            ))}
                        </div>
                      </section>
                    )}
                </>
              )}
            </main>
          )}

          {/* ==================================
              WATCHLIST
              ================================== */}

          {view === 'watchlist' && (
            <main className="content page">
              <p className="eyebrow">
                YOUR PERSONAL COLLECTION
              </p>

              <h1>
                My <em>Watchlist.</em>
              </h1>

              <p className="page-description">
                The stories you can't wait to watch.
              </p>

              {saved.length ? (
                <>
                  <div className="movie-grid">
                    {saved.map((movie) => (
                      <Poster
                        key={movie.id}
                        movie={movie}
                        onOpen={openDetail}
                        onToggle={toggle}
                        saved={true}
                      />
                    ))}
                  </div>

                  <div className="watchlist-recommendations-link">
                    <div>
                      <p className="eyebrow">
                        <Sparkles size={13} />
                        YOUR NEXT DISCOVERY
                      </p>

                      <h3>
                        Love these movies?
                        There's more to explore.
                      </h3>
                    </div>

                    <button
                      className="primary-btn"
                      onClick={() => navigate('for-you')}
                    >
                      Explore For You
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty">
                  <Bookmark size={46} />

                  <h2>
                    Your watchlist is waiting.
                  </h2>

                  <p>
                    Save movies with the + button
                    to keep them here.
                  </p>

                  <button
                    className="primary-btn"
                    onClick={() => navigate('discover')}
                  >
                    Explore Movies
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </main>
          )}
        </>
      )}

      {/* ==================================
          FOOTER
          ================================== */}

      <footer>
        <div className="footer-top">
          <div>
            <div className="footer-logo">
              CINE<span>ORA</span><i>.</i>
            </div>

            <p>Every story starts here.</p>
          </div>

          <p>Discover. Explore. Remember.</p>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} CINEORA.
            Crafted for film lovers.
          </span>

          <span>
            This product uses the TMDB API but is not
            endorsed or certified by TMDB.
            Movie data and images © their respective owners.
          </span>
        </div>
      </footer>

      {/* ==================================
          MOVIE DETAILS MODAL
          ================================== */}

      {detail && (
        <div
          className="modal-backdrop"
          onClick={() => setDetail(null)}
          role="presentation"
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${detail.title} details`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={() => setDetail(null)}
              aria-label="Close details"
            >
              <X />
            </button>

            <div
              className="modal-backdrop-image"
              style={{
                backgroundImage: detail.backdrop_path
                  ? `linear-gradient(
                      0deg,
                      #202124 0%,
                      transparent 95%
                    ),
                    url(${img(
                      detail.backdrop_path,
                      'w1280'
                    )})`
                  : undefined,
              }}
            />

            <div className="modal-content">
              <p className="eyebrow">
                THE STORY BEHIND THE SCREEN
              </p>

              <h2>{detail.title}</h2>

              <div className="detail-meta">
                <span>
                  <Star size={15} fill="currentColor" />
                  {detail.vote_average?.toFixed(1)}
                </span>

                <span>
                  {detail.release_date?.slice(0, 4) ||
                    'TBA'}
                </span>

                {detail.runtime && (
                  <span>
                    {Math.floor(detail.runtime / 60)}h{' '}
                    {detail.runtime % 60}m
                  </span>
                )}
              </div>

              <p>
                {detail.overview ||
                  'Synopsis not available.'}
              </p>

              {detail.genres && (
                <div className="detail-genres">
                  {detail.genres.map((genre) => (
                    <span key={genre.id}>
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="detail-buttons">
                <button
                  className="primary-btn"
                  onClick={() => toggle(detail)}
                >
                  {ids.includes(detail.id) ? (
                    <Check size={18} />
                  ) : (
                    <Plus size={18} />
                  )}

                  {ids.includes(detail.id)
                    ? 'In Watchlist'
                    : 'Add to Watchlist'}
                </button>
              </div>

              {trailerLoading ? (
                <p className="trailer-note">
                  Looking for a trailer...
                </p>
              ) : trailer ? (
                <div className="trailer">
                  <h3>Official Trailer</h3>

                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${trailer}`}
                    title={`${detail.title} trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="trailer-note">
                  Trailer unavailable for this title.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
