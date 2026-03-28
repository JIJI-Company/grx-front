function moveSlider(amount) {
  const slider = document.getElementById('memberSlider');
  slider.scrollLeft += amount;
}

document.addEventListener('DOMContentLoaded', () => {
  const enterBtn = document.getElementById('enter-btn');
  const gate = document.getElementById('intro-gate');
  const introContent = document.querySelector('.intro-content');

  // 한 번 봤으면 게이트 스킵
  if (sessionStorage.getItem('gateShown')) {
    if (gate) gate.style.display = 'none';
    document.body.classList.add('show-main');
  }

  if (enterBtn && gate) {
    enterBtn.addEventListener('click', () => {
      gate.classList.add('open');

      if (introContent) {
        introContent.style.opacity = '0';
        introContent.style.transform = 'scale(0.8)';
        introContent.style.pointerEvents = 'none';
      }

      document.body.classList.add('show-main');

      setTimeout(() => {
        gate.style.display = 'none';
        sessionStorage.setItem('gateShown', 'true'); // 본 것으로 저장
      }, 1200);
    });
  }

  // nav 스크롤 효과
  window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
      nav.style.background = 'rgba(0, 0, 0, 0.95)';
      nav.style.borderBottom = '1px solid rgba(139, 0, 0, 0.6)';
    } else {
      nav.style.background = 'rgba(0, 0, 0, 0.8)';
      nav.style.borderBottom = '1px solid rgba(139, 0, 0, 0.4)';
    }
  });

  // 메뉴 활성화
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (currentPath.includes(href.replace('.html', ''))) {
      link.classList.add('active');
    }
  });

  // animate-fade-in 스크롤 감지
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  document
    .querySelectorAll('.animate-fade-in')
    .forEach((el) => observer.observe(el));
});
