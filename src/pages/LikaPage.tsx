import { LoadingState } from '../components/common/AsyncState';
import LikaCharacterInfo from '../components/lika/LikaCharacterInfo';
import LikaDiary from '../components/lika/LikaDiary';
import LikaGallery from '../components/lika/LikaGallery';
import LikaHero from '../components/lika/LikaHero';
import { useMember } from '../hooks/useMembers';

export default function LikaPage() {
  const { data: lika, isLoading } = useMember('lika');

  if (isLoading) {
    return (
      <div className="page-wrap">
        <LoadingState message="리카의 공간을 여는 중..." />
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <LikaHero member={lika} />
      {lika && <LikaCharacterInfo member={lika} />}
      <LikaGallery />
      <LikaDiary />
    </div>
  );
}
