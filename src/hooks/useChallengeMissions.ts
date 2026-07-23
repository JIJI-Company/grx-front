import { useQuery } from '@tanstack/react-query';
import { apiGetChallengeBalloonTotals } from '../api/client';

/**
 * SOOP 도전미션의 '진행 중 모금 별풍선' 합계를 soopId 배열로 조회한다.
 * queryKey는 정렬된 soopId로 안정화(순서 무관 동일 캐시). soopIds 비면 비활성.
 */
export function useChallengeBalloonTotals(soopIds: string[]) {
  const sorted = [...soopIds].sort();
  return useQuery({
    queryKey: ['challenge-balloons', sorted],
    queryFn: () => apiGetChallengeBalloonTotals(soopIds),
    staleTime: 1000 * 60 * 5,
    enabled: soopIds.length > 0,
  });
}
