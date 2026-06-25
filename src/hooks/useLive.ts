import { useQuery } from '@tanstack/react-query';
import { apiGetLiveStatus } from '../api/client';

export function useLiveStatus() {
  return useQuery({
    queryKey: ['live-status'],
    queryFn: apiGetLiveStatus,
    // Refresh only when the user visits (component mount). No timer / background
    // polling, no window-focus refetch — keeps backend live polls and DB reads down.
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
