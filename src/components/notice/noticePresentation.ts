import type { NoticeItem, NoticeStreamer } from '../../api/types';

export interface NoticeListItem {
  notice: NoticeItem;
  streamer: NoticeStreamer;
}

export function getLatestNotices(streamers: NoticeStreamer[]): NoticeListItem[] {
  return streamers
    .flatMap((streamer) =>
      streamer.notices.map((notice) => ({
        notice,
        streamer,
      })),
    )
    .sort((a, b) => b.notice.date.localeCompare(a.notice.date));
}
