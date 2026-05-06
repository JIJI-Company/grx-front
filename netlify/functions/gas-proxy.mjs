export default async (req, context) => {
  const GAS_URL = "https://script.google.com/macros/s/AKfycby4sJuWEuD8EcfMCMEZMKb6OgB3cVPSiY5_JQ20EElnD7tKlBy7czrIkMacgpCH5sSB/exec";
  const API_TOKEN = "ggu_castle_secure_99";

  // URL 파싱 안정화
  const url = new URL(req.url);
  const searchParams = url.searchParams;

  const action = searchParams.get('action');
  const sheet = searchParams.get('sheet');

  const newParams = new URLSearchParams(searchParams);
  newParams.set('token', API_TOKEN);

  const finalUrl = `${GAS_URL}?${newParams.toString()}`;

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
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: "Server Error", details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
