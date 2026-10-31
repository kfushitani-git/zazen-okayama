'use strict';
(()=>{
  const carousel=document.getElementById('hero-carousel');if(!carousel)return;
  const track=carousel.querySelector('.hero-track'),slides=[...carousel.querySelectorAll('.hero-slide')],pause=document.getElementById('hero-pause'),position=document.getElementById('hero-position'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,paused=motion.matches,hover=false,timer;
  function schedule(){clearTimeout(timer);if(!paused&&!hover&&!document.hidden&&!carousel.contains(document.activeElement))timer=setTimeout(()=>show(index+1),6000);}
  function show(next){index=(next+slides.length)%slides.length;track.style.transform=`translateX(-${index*100}%)`;slides.forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==index));slide.inert=i!==index;slide.querySelectorAll('a').forEach(a=>a.tabIndex=i===index?0:-1);});position.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;schedule();}
  function state(){pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',paused?'写真の自動切り替えを開始':'写真の自動切り替えを停止');pause.textContent=paused?'▶':'Ⅱ';schedule();}
  document.getElementById('hero-prev').addEventListener('click',()=>show(index-1));document.getElementById('hero-next').addEventListener('click',()=>show(index+1));pause.addEventListener('click',()=>{paused=!paused;state();});
  carousel.addEventListener('pointerenter',()=>{hover=true;schedule();});carousel.addEventListener('pointerleave',()=>{hover=false;schedule();});carousel.addEventListener('focusin',schedule);carousel.addEventListener('focusout',()=>setTimeout(schedule,0));document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',()=>{paused=motion.matches;state();});
  show(0);state();
})();
