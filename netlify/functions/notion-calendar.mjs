// netlify/functions/notion-calendar.mjs
export default async (req, context) => {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return new Response(
      JSON.stringify({ error: "Server missing Notion API Key or Database ID in environment variables" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const apiUrl = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sorts: [{ property: "날짜", direction: "descending" }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Notion DB 데이터 매핑
    const schedules = data.results.map((page) => {
      const props = page.properties;
      
      const title = props["제목"]?.title?.[0]?.plain_text ?? "";
      const date = props["날짜"]?.date?.start ?? "";
      const endDate = props["날짜"]?.date?.end ?? "";
      const members = props["멤버"]?.multi_select?.map((m) => m.name) ?? [];
      const tags = props["태그"]?.multi_select?.map((t) => t.name) ?? 
                   props["Tags"]?.multi_select?.map((t) => t.name) ?? [];
      const platform = props["플랫폼"]?.select?.name ?? "";
      const url = props["URL"]?.url ?? "";
      const memo = (props["설명"]?.rich_text?.[0]?.plain_text || props["메모"]?.rich_text?.[0]?.plain_text) ?? "";

      return {
        id: page.id,
        title,
        date,
        endDate,
        tags,
        members,
        platform,
        url,
        memo
      };
    });

    return new Response(JSON.stringify(schedules), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Notion Proxy Failed", details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
