import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCalendar } from '../hooks/useCalendar';
import { useContentsArchive, useNews, useNotice } from '../hooks/useContent';
import { useLiveStatus } from '../hooks/useLive';
import CurrentMissionSection from '../components/home/CurrentMissionSection';
import ContentsPreview from '../components/home/ContentsPreview';
import HomeHero from '../components/home/HomeHero';
import IntroGate from '../components/home/IntroGate';
import MemberSlider from '../components/home/MemberSlider';
import NewsSection from '../components/home/NewsSection';
import WeeklyCalendar from '../components/home/WeeklyCalendar';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const { data: liveData = [] } = useLiveStatus();
  const { data: newsData } = useNews(6);
  const { data: noticeData = [] } = useNotice();
  const { data: calendarData = [] } = useCalendar();
  const { data: contentsData = [], isLoading: contentsLoading } = useContentsArchive();

  useEffect(() => {
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.animate-fade-in').forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: element,
              start: 'top 85%',
              toggleClass: 'is-visible',
              once: true,
            },
          },
        );
      });
    });

    return () => context.revert();
  }, []);

  return (
    <>
      <IntroGate />
      <HomeHero />
      <CurrentMissionSection liveData={liveData} notices={noticeData} />
      <WeeklyCalendar events={calendarData} />
      <ContentsPreview items={contentsData} isLoading={contentsLoading} />
      <NewsSection items={newsData?.items ?? []} />
      <MemberSlider />
    </>
  );
}
