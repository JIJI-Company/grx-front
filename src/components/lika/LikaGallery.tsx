const panels = [
  { src: '/rika/panel_02.png', alt: '카페 생각중' },
  { src: '/rika/panel_03.png', alt: '글쓰기' },
  { src: '/rika/panel_04.png', alt: '꽃다발' },
  { src: '/rika/panel_05.png', alt: '곰인형' },
  { src: '/rika/panel_06.png', alt: '치어리더' },
];

export default function LikaGallery() {
  return (
    <>
      <h2 className="section-title">LIKA GALLERY</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 48,
        }}
      >
        {panels.map((panel) => (
          <div
            key={panel.src}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <img src={panel.src} alt={panel.alt} style={{ width: '100%', display: 'block' }} />
          </div>
        ))}
      </div>
    </>
  );
}
