// Use TMDB API token from environment variables
const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;

const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export async function searchMovieResults(query: string): Promise<{ title: string; year: string; rating: string; posterUrl: string | null; genre: string }[]> {
  if (!TMDB_API_KEY) {
    return [];
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results.slice(0, 5).map((match: any) => ({
        title: match.title,
        year: match.release_date ? match.release_date.split('-')[0] : 'Unknown',
        rating: match.vote_average ? `${match.vote_average.toFixed(1)}/10` : 'NR',
        posterUrl: match.poster_path ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
        genre: match.genre_ids && match.genre_ids.length > 0 ? TMDB_GENRE_MAP[match.genre_ids[0]] || 'Film' : 'Film'
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error("Error searching movies:", error);
    return [];
  }
}

export async function searchMovieDetails(query: string): Promise<{ title: string; year: string; rating: string; posterUrl: string | null; genre: string } | null> {
  if (!TMDB_API_KEY) {
    console.warn("VITE_TMDB_API_KEY not configured. Falling back to simple default.");
    return { title: query, year: 'Unknown', rating: 'N/A', posterUrl: null, genre: 'Film' };
  }

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const bestMatch = data.results[0];
      const year = bestMatch.release_date ? bestMatch.release_date.split('-')[0] : 'Unknown';
      const posterUrl = bestMatch.poster_path ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}` : null;
      
      return {
        title: bestMatch.title,
        year,
        rating: bestMatch.vote_average ? `${bestMatch.vote_average.toFixed(1)}/10` : 'NR',
        posterUrl,
        genre: bestMatch.genre_ids && bestMatch.genre_ids.length > 0 ? TMDB_GENRE_MAP[bestMatch.genre_ids[0]] || 'Film' : 'Film'
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error searching movie details via TMDB:", error);
    return { title: query, year: 'Unknown', rating: 'N/A', posterUrl: null, genre: 'Film' };
  }
}

export async function findMoviePoster(title: string, year?: string): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    let searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&page=1`;
    if (year) {
      searchUrl += `&year=${year}`;
    }
    
    const response = await fetch(searchUrl);
    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const bestMatch = data.results[0];
      if (bestMatch.poster_path) {
        return `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error finding movie poster via TMDB:", error);
    return null;
  }
}
