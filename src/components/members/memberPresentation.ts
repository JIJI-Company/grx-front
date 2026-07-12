import type { Member } from '../../api/types';

export const MEMBER_TIER_META = [
  { tone: 'upper', label: '상현', color: '#ff1a4a' },
  { tone: 'lower', label: '하현', color: '#4aa3ff' },
  { tone: 'new', label: 'NEW', color: '#f5c451' },
] as const;

export type MemberTierTone = (typeof MEMBER_TIER_META)[number]['tone'];

export function getMemberRankLabel(member: Member): string {
  const rankSlug = member.rank?.slug;

  if (rankSlug === 'master') return 'MASTER';
  if (rankSlug === 'upper-rank') return `상현 ${member.displayOrder}`;
  if (rankSlug === 'lower-rank') return `하현 ${member.displayOrder}`;

  if (rankSlug === 'new') return 'NEW';
  return member.rank?.name ?? '';
}

export function splitHashTags(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function getMemberSummary(member: Member): string {
  return member.description?.split('\n')[0] ?? '';
}
