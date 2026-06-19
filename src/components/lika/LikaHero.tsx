import type { Member } from '../../api/types';

interface LikaHeroProps {
  member?: Member;
}

export default function LikaHero({ member }: LikaHeroProps) {
  const soopAccount = member?.platformAccounts.find(
    (account) => account.platform.code === 'SOOP',
  );

  return (
    <div className="mb-12 flex flex-col items-center gap-4 text-center">
      {member?.profileAsset?.publicUrl && (
        <div className="relative size-36 sm:size-40">
          <img
            src={member.profileAsset.publicUrl}
            alt="리카"
            className="size-full rounded-full border-3 border-[#F2D27A] object-cover object-top"
          />
          <img
            src="/rika/lika_wink.gif"
            alt="wink"
            className="absolute right-0 bottom-0 size-14 rounded-full sm:size-15"
          />
        </div>
      )}
      <h1 className="glow-title font-display text-[clamp(2.25rem,9vw,3rem)] tracking-[0.08em]">
        LIKA&apos;S SPACE
      </h1>
      <p className="text-sm tracking-[0.14em] text-ink-300">
        상현의 5 · 항아리 소환 · ESFJ
      </p>
      {soopAccount?.channelUrl && (
        <a
          href={soopAccount.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="premium-view-live-btn mt-2"
        >
          <span>SOOP 방송국 바로가기 ►</span>
        </a>
      )}
    </div>
  );
}
