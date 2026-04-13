// netlify/functions/gas-proxy.mjs
export default async (req, context) => {
  const GAS_URL = process.env.GAS_URL;
  const GALLERY_GAS_URL = process.env.GALLERY_GAS_URL;
  const API_TOKEN = process.env.GAS_API_TOKEN;

  // URL 쿼리 파라미터 추출
  const urlParams = new URL(req.url).searchParams;
  const sheet = urlParams.get('sheet');
  const type = urlParams.get('type'); // 'gallery' 여부 판별용

  if (!GAS_URL || !API_TOKEN) {
    return new Response(JSON.stringify({ error: "Server missing GAS Config" }), { status: 500 });
  }

  // 갤러리 시트인 경우 다른 URL 사용
  let targetUrl = (sheet === 'Gallery' || type === 'gallery') ? GALLERY_GAS_URL : GAS_URL;
  
  // GAS URL에 파라미터 조합
  const finalUrl = `${targetUrl}?sheet=${sheet}&token=${API_TOKEN}`;

  try {
    const response = await fetch(finalUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "GAS Proxy Failed", details: error.message }), { status: 500 });
  }
};
