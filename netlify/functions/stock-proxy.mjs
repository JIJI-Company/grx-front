export default async (req, context) => {
  // 사용자가 주신 새 구글 시트 웹 앱 URL
  const STOCK_GAS_URL = "https://script.google.com/macros/s/AKfycbwC-0A5pyhPL7RnNL5UANqmZYYh0UOeP2-A6hHdu6_8VnlMjhx963DVdNZMcs8ai7xH9A/exec";

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
