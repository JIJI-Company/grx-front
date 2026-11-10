import { useQuery } from '@tanstack/react-query';
import { apiGetCastleHalls, apiGetCastleStatues } from '../api/client';

export function useCastleStatues() {
  return useQuery({
    queryKey: ['castle', 'statues'],
    queryFn: apiGetCastleStatues,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCastleHalls() {
  return useQuery({
    queryKey: ['castle', 'halls'],
    queryFn: apiGetCastleHalls,
    staleTime: 1000 * 30,
  });
}
