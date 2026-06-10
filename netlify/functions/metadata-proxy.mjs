// netlify/functions/metadata-proxy.mjs
export default async (req, context) => {
  const urlParams = new URL(req.url).searchParams;
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: "Missing url parameter" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 1. 숲(SOOP/AfreecaTV) VOD 처리 - Mobile API 사용
  const isSoopVod = targetUrl.includes('sooplive.co.kr/player/') || 
                    targetUrl.includes('sooplive.com/player/') || 
                    targetUrl.includes('afreecatv.com/player/') || 
                    targetUrl.includes('afree.ca/player/');

  if (isSoopVod) {
    // URL에서 title_no (영상 고유 ID) 추출
    const match = targetUrl.match(/\/player\/(\d+)/);
    if (match && match[1]) {
      const titleNo = match[1];
      try {
        const response = await fetch("https://api.m.afreecatv.com/station/video/a/view", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: `nTitleNo=${titleNo}`
        });

        if (response.ok) {
          const apiData = await response.json();
          if (apiData && apiData.data) {
            return new Response(
              JSON.stringify({
                ogImage: apiData.data.thumb || apiData.data.thumbnail_url || null,
                ogTitle: apiData.data.title || apiData.data.full_title || null,
                source: 'soop_mobile_api'
              }),
              {
                status: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                }
              }
            );
          }
        }
      } catch (e) {
        console.warn("[metadata-proxy] SOOP Mobile API failed, falling back to HTML scrape:", e.message);
      }
    }
  }

  // 2. 일반 사이트 크롤링 및 폴백 처리 (og:image, og:title 추출)
  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Target returned status ${response.status}`);
    }

    const html = await response.text();

    // og:image 파싱
    const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    const ogImage = imageMatch ? imageMatch[1] : null;

    // og:title 파싱
    const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    const ogTitle = titleMatch ? titleMatch[1] : null;

    return new Response(
      JSON.stringify({
        ogImage,
        ogTitle,
        source: 'html_scrape'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Metadata extraction failed", details: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
};
