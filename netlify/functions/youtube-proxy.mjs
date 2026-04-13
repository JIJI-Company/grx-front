// netlify/functions/youtube-proxy.mjs
export default async (req, context) => {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  const urlParams = new URL(req.url).searchParams;
  const playlistId = urlParams.get('playlistId');

  if (!YOUTUBE_API_KEY) {
    return new Response(JSON.stringify({ error: "Server missing YouTube API Key" }), { status: 500 });
  }

  if (!playlistId) {
    return new Response(JSON.stringify({ error: "Missing playlistId" }), { status: 400 });
  }

  const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${YOUTUBE_API_KEY}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`YouTube API Error: ${response.status}`);
    
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "YouTube Proxy Failed", details: error.message }), { status: 500 });
  }
};
