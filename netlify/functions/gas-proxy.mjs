export default async (req, context) => {
  const GAS_URL = process.env.GAS_URL;
  const GALLERY_GAS_URL = process.env.GALLERY_GAS_URL;
  const API_TOKEN = process.env.GAS_API_TOKEN;

  // 🏛️ [V7.3] URL 파라미터 추출 (Netlify Edge 대응)
  const { searchParams } = new URL(req.url);
  const sheet = searchParams.get('sheet');
  const type = searchParams.get('type');

  if (!GAS_URL || !API_TOKEN) {
    return new Response(JSON.stringify({ error: "Server missing GAS Config (Env vars not set)" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 갤러리/일반 시트 타겟 URL 결정
  let targetUrl = (sheet === 'Gallery' || type === 'gallery') ? GALLERY_GAS_URL : GAS_URL;

  // 클라이언트가 보낸 모든 파라미터를 유지한 채로 token만 추가
  const newParams = new URLSearchParams(searchParams);
  newParams.set('token', API_TOKEN);
  const finalUrl = `${targetUrl}?${newParams.toString()}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Accept': 'application/json'
      }
    };

    // POST 요청일 경우 본문(Body) 추가
    if (req.method === 'POST') {
      fetchOptions.body = await req.text();
      fetchOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(finalUrl, fetchOptions);
    if (!response.ok) throw new Error(`GAS returned ${response.status}`);
    
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error("GAS Proxy Error:", error);
    return new Response(JSON.stringify({ error: "GAS API 호출 실패", details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
