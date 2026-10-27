import { useCallback, useEffect, useMemo, useState } from 'react';
import FanArtCard from '../components/fanart/FanArtCard';
import FanArtLightbox from '../components/fanart/FanArtLightbox';
import FanArtUploadModal from '../components/fanart/FanArtUploadModal';
import { FANART_MEMBERS, MOCK_FANARTS, type FanArt, type FanArtMember } from '../components/fanart/fanartMockData';
import { apiGetFanArt, apiUploadFanArt } from '../api/client';
import { useMembers } from '../hooks/useMembers';
import type { FanArtItem } from '../api/types';

const ALL = '전체';
const USE_MOCK = import.meta.env.VITE_MOCK === 'true';

function apiItemToFanArt(item: FanArtItem): FanArt {
  return {
    id: item.id,
    title: item.title,
    authorName: item.authorName,
    memberNames: item.members.map((m) => m.stageName),
    imageUrl: item.imageUrl,
    thumbUrl: item.thumbUrl,
    width: item.width,
    height: item.height,
    createdAt: item.createdAt,
  };
}

export default function FanArtPage() {
  const [items, setItems] = useState<FanArt[]>([]);
  const [selected, setSelected] = useState<FanArt | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [filterMember, setFilterMember] = useState(ALL);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { data: membersData } = useMembers();

  const chipMembers = useMemo<FanArtMember[]>(() => {
    if (!membersData) return FANART_MEMBERS;
    const all = [
      ...(membersData.master ?? []),
      ...(membersData.upper ?? []),
      ...(membersData.lower ?? []),
      ...(membersData.new ?? []),
      ...(membersData.other ?? []),
    ];
    return all.map((m) => ({
      name: m.stageName,
      avatar: m.profileAsset?.publicUrl ?? null,
      color: m.personalColor ?? '#888',
    }));
  }, [membersData]);

  const loadFanArt = useCallback(async () => {
    if (USE_MOCK) {
      setItems(MOCK_FANARTS);
      return;
    }
    setLoading(true);
    try {
      const res = await apiGetFanArt({ limit: 50 });
      setItems(res.items.map(apiItemToFanArt));
    } catch {
      setItems(MOCK_FANARTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFanArt(); }, [loadFanArt]);

  const filtered = useMemo(
    () => filterMember === ALL
      ? items
      : items.filter((a) => a.memberNames.includes(filterMember)),
    [filterMember, items],
  );

  const handleUpload = async (data: { file: File; title: string; authorName: string; memberNames: string[] }) => {
    if (USE_MOCK) {
      console.log('mock upload:', data);
      setShowUpload(false);
      return;
    }
    setUploading(true);
    try {
      await apiUploadFanArt({
        file: data.file,
        title: data.title,
        authorName: data.authorName,
        memberNames: data.memberNames,
      });
      setShowUpload(false);
      loadFanArt();
    } catch (err) {
      alert(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-wrap fanart-root">
      <header className="fanart-hero">
        <span className="fanart-hero-eyebrow">Fan Art Gallery</span>
        <h1 className="fanart-hero-title">팬아트</h1>
        <p className="fanart-hero-sub">꾸한성 멤버들의 팬아트</p>
      </header>

      <MemberFilterRail
        members={chipMembers}
        selected={filterMember}
        onSelect={setFilterMember}
      />

      <div className="fanart-toolbar">
        <span className="fanart-count">{filtered.length}개의 작품</span>
        <button
          type="button"
          className="fanart-upload-btn"
          onClick={() => setShowUpload(true)}
        >
          <span>+</span> 업로드
        </button>
      </div>

      {loading ? (
        <p className="fanart-empty">로딩 중...</p>
      ) : (
        <div className="fanart-masonry">
          {filtered.map((art) => (
            <FanArtCard key={art.id} art={art} onOpen={setSelected} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="fanart-empty">아직 등록된 팬아트가 없습니다</p>
      )}

      {selected && (
        <FanArtLightbox art={selected} onClose={() => setSelected(null)} />
      )}

      {showUpload && (
        <FanArtUploadModal
          members={chipMembers}
          onClose={() => setShowUpload(false)}
          onSubmit={handleUpload}
          uploading={uploading}
        />
      )}
    </div>
  );
}

function MemberFilterRail({
  members,
  selected,
  onSelect,
}: {
  members: FanArtMember[];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="fanart-chip-rail">
      <button
        type="button"
        className={`fanart-chip${selected === ALL ? ' is-active' : ''}`}
        onClick={() => onSelect(ALL)}
      >
        전체
      </button>
      {members.map((m) => (
        <button
          key={m.name}
          type="button"
          className={`fanart-chip${selected === m.name ? ' is-active' : ''}`}
          style={{ '--chip-color': m.color } as React.CSSProperties}
          onClick={() => onSelect(m.name)}
        >
          {m.name}
        </button>
      ))}
    </div>
  );
}
