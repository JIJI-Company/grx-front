// 광장 게시판 데이터: 이번 주 일정. 개발 서버에서 로컬 일정이 비어 있으면 운영 공개 API를 읽기만 한다(useHallData와 같은 방식).
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CalendarEvent } from '../../../api/types';
import { useCalendar } from '../../../hooks/useCalendar';
import { thisWeekSchedule, type BoardDay } from './schedulePresentation';

export function usePlazaData(): { days: BoardDay[] } {
  const local = useCalendar();
  const useProd = import.meta.env.DEV && local.isSuccess && local.data.length === 0;
  const prod = useQuery({
    queryKey: ['plaza-dev', 'calendar'],
    queryFn: async () => {
      const res = await fetch('/prod-api/calendar');
      if (!res.ok) throw new Error(`prod calendar ${res.status}`);
      return (await res.json()) as CalendarEvent[];
    },
    enabled: useProd,
    staleTime: Infinity,
    retry: false,
  });
  const source = useProd ? prod.data : local.data;
  return useMemo(() => ({ days: thisWeekSchedule(source ?? []) }), [source]);
}
