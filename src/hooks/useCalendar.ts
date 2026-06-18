import { useQuery } from '@tanstack/react-query';
import { apiGetCalendar } from '../api/client';

export function useCalendar() {
  return useQuery({
    queryKey: ['calendar'],
    queryFn: apiGetCalendar,
    staleTime: 5 * 60 * 1000,
  });
}
