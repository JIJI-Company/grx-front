import { useQuery } from '@tanstack/react-query';
import {
  apiGetContent,
  apiGetSchedule,
  apiGetHistory,
  apiGetNotice,
  apiGetYoutubeLatest,
} from '../api/client';

export function useNews(limit = 20) {
  return useQuery({
    queryKey: ['content', 'NEWS', limit],
    queryFn: () => apiGetContent({ type: 'NEWS', status: 'PUBLISHED', limit }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useNotices(limit = 20) {
  return useQuery({
    queryKey: ['content', 'NOTICE', limit],
    queryFn: () => apiGetContent({ type: 'NOTICE', status: 'PUBLISHED', limit }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSchedule(upcomingOnly = false) {
  return useQuery({
    queryKey: ['schedule', upcomingOnly],
    queryFn: () => apiGetSchedule(upcomingOnly),
    staleTime: 1000 * 60,
  });
}

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: () => apiGetHistory(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useNotice() {
  return useQuery({
    queryKey: ['notice'],
    queryFn: apiGetNotice,
    staleTime: 1000 * 60 * 3,
  });
}

export function useYoutubeLatest() {
  return useQuery({
    queryKey: ['youtube-latest'],
    queryFn: apiGetYoutubeLatest,
    staleTime: 1000 * 60 * 30,
  });
}
