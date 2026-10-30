/* Version mobile « stories » : un écran par partie, glissé au doigt */
(function () {
  var root = document.querySelector('[data-stories]');
  if (!root) return;
  var scroller = root.querySelector('.m-scroller');
  var bar = root.querySelector('.m-bar');
  var label = root.querySelector('.m-label');
  var chapters = Array.prototype.slice.call(root.querySelectorAll('.m-ch'));
  var segs = Array.prototype.slice.call(root.querySelectorAll('.m-seg'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var current = 0;

  // ordre d'apparition des éléments de chaque écran
  chapters.forEach(function (ch) {
    ch.querySelectorAll('.m-in, .m-step, .m-tile').forEach(function (el, k) { el.style.setProperty('--k', k); });
  });
  root.classList.add('m-ready');

  var goTo = function (id, smooth) {
    var t = document.getElementById(id);
    if (!t) return;
    scroller.scrollTo({ top: t.offsetTop, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };
  root.querySelectorAll('[data-go]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); goTo(a.getAttribute('data-go'), true); });
  });

  var setCurrent = function (i) {
    current = i;
    var ch = chapters[i];
    ch.classList.add('on');
    segs.forEach(function (s, k) { s.classList.toggle('done', k < i); s.classList.toggle('cur', k === i); });
    if (label) label.textContent = ch.getAttribute('data-label');
    bar.classList.toggle('dark', ch.getAttribute('data-tone') === 'dark');
    rails.forEach(function (r) { r.update(); });
  };

  // rails horizontaux (projets, posts & vidéos)
  var rails = [];
  root.querySelectorAll('[data-rail]').forEach(function (rail) {
    var items = Array.prototype.slice.call(rail.children);
    var dotsBox = rail.parentElement.querySelector('[data-dots]');
    var isReel = rail.hasAttribute('data-reel');
    var chapter = rail.closest('.m-ch');
    var active = -1;
    var center = function (it) { return it.offsetLeft - (rail.clientWidth - it.offsetWidth) / 2; };
    var dots = items.map(function (it, i) {
      if (!dotsBox) return null;
      var d = document.createElement('button'); d.type = 'button';
      d.setAttribute('aria-label', 'Élément ' + (i + 1));
      d.addEventListener('click', function () { rail.scrollTo({ left: center(it), behavior: reduce ? 'auto' : 'smooth' }); });
      dotsBox.appendChild(d); return d;
    });
    var update = function () {
      var mid = rail.scrollLeft + rail.clientWidth / 2, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var c = it.offsetLeft + it.offsetWidth / 2, d = Math.abs(c - mid); if (d < bd) { bd = d; best = i; } });
      active = best;
      items.forEach(function (it, i) { it.classList.toggle('is-active', i === best); });
      dots.forEach(function (d, i) { if (d) d.setAttribute('aria-current', i === best ? 'true' : 'false'); });
      if (isReel) {
        var visible = chapters[current] === chapter;
        items.forEach(function (it, i) {
          var v = it.querySelector('video');
          if (!v) return;
          if (i === best && visible && !reduce) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }
    };
    var tick = false;
    rail.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; update(); }); } }, { passive: true });
    rails.push({ update: update });
    update();
  });

  // écran courant
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setCurrent(chapters.indexOf(e.target)); });
    }, { root: scroller, threshold: 0.55 });
    chapters.forEach(function (ch) { io.observe(ch); });
  } else {
    chapters.forEach(function (ch) { ch.classList.add('on'); });
  }
  setCurrent(0);

  // arrivée depuis une page projet (#contact, #projets…)
  var map = { contact: 'm-contact', projets: 'm-projets', parcours: 'm-parcours', competences: 'm-competences', contenus: 'm-contenus', top: 'm-intro' };
  var h = (location.hash || '').replace('#', '');
  if (map[h] && window.matchMedia('(max-width: 760px)').matches) {
    setTimeout(function () { goTo(map[h], false); }, 60);
  }
})();
