import type { Member } from '../../api/types';

interface LikaHeroProps {
  member?: Member;
}

export default function LikaHero({ member }: LikaHeroProps) {
  const soopAccount = member?.platformAccounts.find(
    (account) => account.platform.code === 'SOOP',
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        marginBottom: 48,
      }}
    >
      {member?.profileAsset?.publicUrl && (
        <div style={{ position: 'relative', width: 160, height: 160 }}>
          <img
            src={member.profileAsset.publicUrl}
            alt="리카"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              objectPosition: 'top',
              border: '3px solid #F2D27A',
            }}
          />
          <img
            src="/rika/lika_wink.gif"
            alt="wink"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 60,
              height: 60,
              borderRadius: '50%',
            }}
          />
        </div>
      )}
      <h1
        className="glow-title"
        style={{ fontFamily: "'Oswald', sans-serif", fontSize: '3rem', letterSpacing: 4 }}
      >
        LIKA&apos;S SPACE
      </h1>
      <p style={{ color: '#aaa', letterSpacing: 2, fontSize: '0.85rem' }}>
        상현의 5 · 항아리 소환 · ESFJ
      </p>
      {soopAccount?.channelUrl && (
        <a
          href={soopAccount.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="premium-view-live-btn"
          style={{ marginTop: 8 }}
        >
          <span>SOOP 방송국 바로가기 ►</span>
        </a>
      )}
    </div>
  );
}
