import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCalendar } from '../hooks/useCalendar';
import { useNews, useNotice } from '../hooks/useContent';
import { useLiveStatus } from '../hooks/useLive';
import CurrentMissionSection from '../components/home/CurrentMissionSection';
import HomeHero from '../components/home/HomeHero';
import IntroGate from '../components/home/IntroGate';
import MemberSlider from '../components/home/MemberSlider';
import NewsSection from '../components/home/NewsSection';
import WeeklyCalendar from '../components/home/WeeklyCalendar';

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const entered = useRef(sessionStorage.getItem('ggu-entered') === '1');
  const { data: liveData = [] } = useLiveStatus();
  const { data: newsData } = useNews(6);
  const { data: noticeData = [] } = useNotice();
  const { data: calendarData = [] } = useCalendar();

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

  const handleEnter = () => {
    const gate = document.getElementById('intro-gate');
    if (gate) gate.classList.add('open');
    sessionStorage.setItem('ggu-entered', '1');

    setTimeout(() => {
      if (gate) gate.style.display = 'none';
      entered.current = true;
    }, 1500);
  };

  useEffect(() => {
    if (entered.current) {
      const gate = document.getElementById('intro-gate');
      if (gate) gate.style.display = 'none';
    }
  }, []);

  return (
    <>
      {!entered.current && <IntroGate onEnter={handleEnter} />}
      <HomeHero />
      <CurrentMissionSection liveData={liveData} notices={noticeData} />
      <WeeklyCalendar events={calendarData} />
      <NewsSection items={newsData?.items ?? []} />
      <MemberSlider />
    </>
  );
}
