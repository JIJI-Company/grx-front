// netlify/functions/notion-bj.mjs
// Returns BJ 데이터 rows: [{ soopId, name, color, boardNo, tmi, mbti, birth, hashTag }]
export default async (_req, _context) => {
  const NOTION_API_KEY = process.env.NOTION_API_KEY;
  const NOTION_BJ_DATABASE_ID = process.env.NOTION_BJ_DATABASE_ID;

  if (!NOTION_API_KEY || !NOTION_BJ_DATABASE_ID) {
    return new Response(
      JSON.stringify({ error: 'Server missing NOTION_API_KEY or NOTION_BJ_DATABASE_ID' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_BJ_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion API Error: ${res.status} - ${text}`);
    }

    const data = await res.json();
    const formatDateValue = (value) => {
      if (!value) return '';
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return value;
      return `${match[2]}.${match[3]}`;
    };
    const readProp = (prop) => {
      if (!prop) return '';
      switch (prop.type) {
        case 'title':
          return (prop.title ?? []).map((item) => item.plain_text).join('');
        case 'rich_text':
          return (prop.rich_text ?? []).map((item) => item.plain_text).join('');
        case 'select':
          return prop.select?.name ?? '';
        case 'status':
          return prop.status?.name ?? '';
        case 'date':
          return formatDateValue(prop.date?.start ?? prop.date?.end ?? '');
        case 'url':
          return prop.url ?? '';
        case 'number':
          return prop.number != null ? String(prop.number) : '';
        default:
          return '';
      }
    };
    const members = data.results.map((page) => {
      const props = page.properties;
      const name = readProp(props['name']);
      const soopId = readProp(props['soopId']);
      const color = readProp(props['color']);
      const boardNo = readProp(props['boardNo']);
      const tmi = readProp(props['tmi']);
      const mbti = readProp(props['mbti']);
      const birth = readProp(props['birth'] ?? props['birthday']);
      const hashTag = readProp(props['hash-tag'] ?? props['hashTag'] ?? props['keywords']);
      return { name, soopId, color, boardNo, tmi, mbti, birth, hashTag };
    });

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Notion BJ proxy failed', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
