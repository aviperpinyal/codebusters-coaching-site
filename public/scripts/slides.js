(() => {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.querySelector('.counter');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.querySelector('.progress');
  let current = 0;

  function show(n) {
    slides[current].classList.remove('active');
    current = Math.max(0, Math.min(n, slides.length - 1));
    slides[current].classList.add('active');
    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === slides.length - 1;
    if (progress) progress.style.width = `${((current + 1) / slides.length) * 100}%`;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => show(current - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => show(current + 1));

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')                    { e.preventDefault(); show(current - 1); }
  });

  show(0);
})();
