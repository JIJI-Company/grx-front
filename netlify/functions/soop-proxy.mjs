// netlify/functions/soop-proxy.mjs
export default async (req, context) => {
  // 🔑 Netlify 환경 변수에서 값 로드
  const ACCESS_TOKEN = process.env.SOOP_ACCESS_TOKEN;
  const CLIENT_ID = process.env.SOOP_CLIENT_ID;

  if (!ACCESS_TOKEN || !CLIENT_ID) {
    return new Response(JSON.stringify({ error: "Server Configuration Error: Missing API Keys" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // SOOP API URL (방송 리스트 조회 등)
  const url = `https://openapi.sooplive.co.kr/broad/list?client_id=${CLIENT_ID}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SOOP API returned ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' // 필요한 경우 CORS 허용
      }
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response(JSON.stringify({ error: "SOOP API 호출 오류", message: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
