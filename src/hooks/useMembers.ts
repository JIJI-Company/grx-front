import { useQuery } from '@tanstack/react-query';
import { apiGetMembers, apiGetMember } from '../api/client';
import { useMemo } from 'react';

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

export function useMemberLookup() {
  const { data } = useMembers();
  return useMemo(() => {
    const avatarMap = new Map<string, string>();
    const colorMap = new Map<string, string>();

    if (data) {
      const all = [
        ...(data.master ?? []),
        ...(data.upper ?? []),
        ...(data.lower ?? []),
        ...(data.new ?? []),
        ...(data.other ?? []),
      ];
      all.forEach((m) => {
        if (m.profileAsset?.publicUrl) {
          avatarMap.set(m.stageName, m.profileAsset.publicUrl);
        }
        if (m.personalColor) {
          colorMap.set(m.stageName, m.personalColor);
        }
      });
    }

    return {
      getAvatar: (name: string, fallback: string) => avatarMap.get(name) || fallback,
      getColor: (name: string, fallback: { bg: string; text: string }) => {
        const hex = colorMap.get(name);
        if (hex) {
          const text = fallback.text === '#aaa' ? '#FFFFFF' : fallback.text;
          return { bg: hex, text };
        }
        return fallback;
      },
    };
  }, [data]);
}
