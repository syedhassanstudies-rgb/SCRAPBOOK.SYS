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

export async function searchSpotifyTrack(query: string): Promise<{ song: string; artist: string; albumArt: string | null } | null> {
  const token = await getAccessToken();
  if (!token) {
    console.warn("Spotify API credentials not configured.");
    return null;
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
    if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
      const track = data.tracks.items[0];
      return {
        song: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        albumArt: track.album.images.length > 0 ? track.album.images[0].url : null,
      };
    }
    return null;
  } catch (error) {
    console.error("Spotify Search Error:", error);
    return null;
  }
}

export async function findSpotifyAlbumArt(song: string, artist?: string): Promise<string | null> {
  const query = `${song} ${artist || ""}`.trim();
  const trackInfo = await searchSpotifyTrack(query);
  return trackInfo?.albumArt || null;
}

