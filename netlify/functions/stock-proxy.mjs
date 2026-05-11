export default async (req, context) => {
  // Netlify 환경 변수에서 URL을 가져옵니다. (없을 경우 기본값 사용)
  // 새로운 GAS 웹 앱 URL 적용
  const STOCK_GAS_URL = "https://script.google.com/macros/s/AKfycbwN-V-JA0J3bp5TBDB-4Jk1uycvmejQM9WdsjE_uW0jykiQSn3SffKdVqx3cKs7J67ICw/exec";
  
  if (!STOCK_GAS_URL) {
    return new Response(JSON.stringify({ error: "GAS_URL_STOCK is not configured." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const finalUrl = `${STOCK_GAS_URL}?${searchParams.toString()}`;

  try {
    const fetchOptions = {
      method: req.method,
      headers: { 'Accept': 'application/json' }
    };

    if (req.method === 'POST') {
      fetchOptions.body = await req.text();
      fetchOptions.headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(finalUrl, fetchOptions);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
