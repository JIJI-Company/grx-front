import { useQuery } from '@tanstack/react-query';
import { apiGetMembers, apiGetMember } from '../api/client';

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: apiGetMembers,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMember(slug: string) {
  return useQuery({
    queryKey: ['member', slug],
    queryFn: () => apiGetMember(slug),
    enabled: !!slug,
  });
}
