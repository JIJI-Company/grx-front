import type { HistoryAchievement } from '../../api/types';
import { MEDAL_LABEL, MEDAL_NUM, categoryMeta, formatDate } from './historyPresentation';

interface AchievementCardProps {
  item: HistoryAchievement;
}

export default function AchievementCard({ item }: AchievementCardProps) {
  const cat = categoryMeta(item.category);
  const members = item.members.join(', ');

  return (
    <div className={`medal-card ${item.medal}`}>
      <div className="medal-card-label">{MEDAL_LABEL[item.medal] ?? 'ACHIEVEMENT'}</div>
      <div className="medal-card-icon">{MEDAL_NUM[item.medal] ?? '🏆'}</div>
      <div className="medal-card-title">{item.title}</div>
      <div className="medal-card-detail">{members || ' '}</div>
      <div className="medal-card-divider" />
      <div className="medal-card-date">{formatDate(item.date)}</div>
      <div className="medal-card-type">
        {cat.emoji} {cat.label}
      </div>
    </div>
  );
}
