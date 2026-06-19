import type { Member } from '../api/types';

const FALLBACK_COLOR = '#B91C1C'; // ruby-600

export function getMemberColor(member: Member | { personalColor?: string | null }): string {
  return member.personalColor ?? FALLBACK_COLOR;
}
