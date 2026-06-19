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
      <div className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {panels.map((panel) => (
          <div
            key={panel.src}
            className="glass-panel overflow-hidden rounded-panel"
          >
            <img src={panel.src} alt={panel.alt} className="size-full object-cover" />
          </div>
        ))}
      </div>
    </>
  );
}
