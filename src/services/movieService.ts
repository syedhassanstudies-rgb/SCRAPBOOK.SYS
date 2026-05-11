// Use TMDB API token from environment variables
const TMDB_API_KEY = (import.meta as any).env.VITE_TMDB_API_KEY;

export async function searchMovieDetails(query: string): Promise<{ title: string; year: string; rating: string; posterUrl: string | null } | null> {
  if (!TMDB_API_KEY) {
    console.warn("VITE_TMDB_API_KEY not configured. Falling back to simple default.");
    return { title: query, year: 'Unknown', rating: 'N/A', posterUrl: null };
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
        posterUrl
      };
    }
    
    return null;
  } catch (error: any) {
    console.error("Error searching movie details via TMDB:", error);
    return { title: query, year: 'Unknown', rating: 'N/A', posterUrl: null };
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
