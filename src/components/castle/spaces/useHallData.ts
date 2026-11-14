// History 전당 전시 데이터: 수상 기록 + 멤버 색·아바타.
// 개발 서버에서 로컬 DB에 수상 기록이 없으면(Notion 연결이 없어 늘 비어 있다) 운영 공개 API를 읽기만 한다
// (vite.config.ts의 /prod-api 프록시). 배포판에서는 항상 자기 서버 데이터만 쓴다.
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HistoryAchievement, MembersGrouped, NoticeStreamer } from '../../../api/types';
import { useHistory, useNotice } from '../../../hooks/useContent';
import { useMembers } from '../../../hooks/useMembers';
import { buildHistoryMemberProfileMap, type HistoryMemberProfileMap } from '../../history/historyPresentation';
import { toHallRecords, type HallRecord } from './historyHallPresentation';

async function fetchProd<T>(path: string): Promise<T> {
  const res = await fetch(`/prod-api${path}`);
  if (!res.ok) throw new Error(`prod ${path} ${res.status}`);
  return res.json();
}

const PROD = { staleTime: Infinity, retry: false } as const;

export function useHallData(): { records: HallRecord[]; profiles: HistoryMemberProfileMap } {
  const local = useHistory();
  const members = useMembers();
  const notice = useNotice();
  const useProd = import.meta.env.DEV && local.isSuccess && local.data.length === 0;
  const prodHistory = useQuery({ queryKey: ['hall-dev', 'history'], queryFn: () => fetchProd<HistoryAchievement[]>('/history'), enabled: useProd, ...PROD });
  const prodMembers = useQuery({ queryKey: ['hall-dev', 'members'], queryFn: () => fetchProd<MembersGrouped>('/members'), enabled: useProd, ...PROD });
  const prodNotice = useQuery({ queryKey: ['hall-dev', 'notice'], queryFn: () => fetchProd<NoticeStreamer[]>('/notice'), enabled: useProd, ...PROD });
  return useMemo(
    () =>
      useProd
        ? { records: toHallRecords(prodHistory.data ?? []), profiles: buildHistoryMemberProfileMap(prodMembers.data, prodNotice.data ?? []) }
        : { records: toHallRecords(local.data ?? []), profiles: buildHistoryMemberProfileMap(members.data, notice.data ?? []) },
    [useProd, prodHistory.data, prodMembers.data, prodNotice.data, local.data, members.data, notice.data],
  );
}
