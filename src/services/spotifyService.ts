// Use Spotify API credentials from environment variables
const SPOTIFY_CLIENT_ID = (import.meta as any).env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = (import.meta as any).env.VITE_SPOTIFY_CLIENT_SECRET;

let accessToken = "";
let tokenExpirationTime = 0;

async function getAccessToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    return null;
  }
  
  if (accessToken && Date.now() < tokenExpirationTime) {
    return accessToken;
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Spotify token");
    }

    const data = await response.json();
    accessToken = data.access_token;
    tokenExpirationTime = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  } catch (error) {
    console.error("Spotify Auth Error:", error);
    return null;
  }
}

export async function searchSpotifyTrack(query: string): Promise<{ song: string; artist: string; albumArt: string | null; previewUrl?: string | null; trackId?: string | null } | null> {
  const token = await getAccessToken();
  if (!token) {
    console.warn("Spotify API credentials not configured. Falling back to iTunes API...");
    return searchItunesTrack(query);
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        throw new Error("Spotify search failed");
    }

    const data = await response.json();
    let result = null;
    if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
      const track = data.tracks.items[0];
      result = {
        song: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        albumArt: track.album.images.length > 0 ? track.album.images[0].url : null,
        previewUrl: track.preview_url || null,
        trackId: track.id,
      };
    }
    
    // If no previewUrl, fallback to iTunes
    if (!result || !result.previewUrl) {
      const itunesResult = await searchItunesTrack(query);
      if (itunesResult) {
        if (!result) return itunesResult;
        result.previewUrl = itunesResult.previewUrl;
      }
    }
    return result;
  } catch (error) {
    console.error("Spotify Search Error:", error);
    // Fallback on error
    return searchItunesTrack(query);
  }
}

async function searchItunesTrack(query: string): Promise<{ song: string; artist: string; albumArt: string | null; previewUrl?: string | null; trackId?: string | null } | null> {
  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      return {
        song: track.trackName,
        artist: track.artistName,
        albumArt: track.artworkUrl100 ? track.artworkUrl100.replace('100x100bb', '600x600bb') : null,
        previewUrl: track.previewUrl || null,
        trackId: track.trackId?.toString() || null,
      };
    }
    return null;
  } catch (err) {
    console.error("iTunes Search Error:", err);
    return null;
  }
}

export async function findSpotifyAlbumArt(song: string, artist?: string): Promise<string | null> {
  const query = `${song} ${artist || ""}`.trim();
  const trackInfo = await searchSpotifyTrack(query);
  return trackInfo?.albumArt || null;
}

