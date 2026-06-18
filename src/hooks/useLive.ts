import { useQuery } from '@tanstack/react-query';
import { apiGetLiveStatus } from '../api/client';

export function useLiveStatus() {
  return useQuery({
    queryKey: ['live-status'],
    queryFn: apiGetLiveStatus,
    // Refresh every 60 seconds on home page; live page does its own interval
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60,
  });
}
