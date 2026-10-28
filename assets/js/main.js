/* Céleste Lubrano di Ciccone — animations du site */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // les animations ne s'activent que si ce script tourne : sans lui, tout reste visible
  doc.classList.add('anim');

  /* 1. Lancement : rideau puis titres */
  window.addEventListener('load', function () { doc.classList.add('loaded'); });
  setTimeout(function () { doc.classList.add('loaded'); }, 1600); // filet de sécurité

  /* Le grand nom tient toujours en entier dans sa colonne */
  var fitHero = function () {
    var h1 = document.querySelector('.hero h1');
    if (!h1) return;
    h1.style.fontSize = '';
    var lines = h1.querySelectorAll('.line'), size = parseFloat(getComputedStyle(h1).fontSize), guard = 40;
    var over = function () { return Array.prototype.some.call(lines, function (l) { var r = document.createRange(); r.selectNodeContents(l.firstElementChild || l); return r.getBoundingClientRect().width > l.clientWidth - 2; }); };
    while (over() && guard-- > 0) { size -= 2; h1.style.fontSize = size + 'px'; }
  };
  fitHero();
  window.addEventListener('resize', fitHero);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

  /* 2. Découpage des titres en mots (apparition mot par mot) */
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') { walk(child); }
      });
    };
    walk(el);
  });

  /* 3. Apparition au défilement */
  var targets = document.querySelectorAll('.rv, .rv-img, .rule, [data-split]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* 4. En-tête : fond au défilement, se cache en descendant */
  var header = document.querySelector('.header');
  var lastY = 0, ticking = false;
  var parallax = document.querySelectorAll('[data-parallax]');
  var journeys = [];
  var stacks = [];
  var collages = Array.prototype.slice.call(document.querySelectorAll('[data-collage]'));
  var bubble = document.querySelector('.bubble');
  var contactSec = document.getElementById('contact');

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('scrolled', y > 40);
      header.classList.toggle('hidden', y > lastY && y > 400 && !doc.classList.contains('menu-open'));
    }
    lastY = y;
    if (!reduce) {
      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var off = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    journeys.forEach(function (j) { j.update(); });
    // collage : les photos arrivent éparpillées et s'assemblent au défilement
    collages.forEach(function (c) {
      if (reduce) { c.style.setProperty('--p', 1); return; }
      var r = c.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
      p = 1 - Math.pow(1 - p, 3);
      c.style.setProperty('--p', p.toFixed(3));
    });
    // bulle de contact : se retire quand on est déjà sur la partie contact
    if (bubble && contactSec) {
      bubble.classList.toggle('away', contactSec.getBoundingClientRect().top < window.innerHeight * 0.75);
    }
    stacks.forEach(function (st) { st.update(); });
    ticking = false;
  }
  /* Frise du parcours : le tracé se dessine au défilement */
  document.querySelectorAll('[data-journey]').forEach(function (root) {
    var path = root.querySelector('.track');
    var tip = root.querySelector('.tip');
    var stops = Array.prototype.slice.call(root.querySelectorAll('.stop'));
    if (!path || !path.getTotalLength) return;
    var L = path.getTotalLength();
    // position de chaque étape le long du tracé
    var fr = stops.map(function (st) {
      var x = +st.getAttribute('data-x'), y = +st.getAttribute('data-y'), best = 0, bd = 1e9;
      for (var l = 0; l <= L; l += 4) { var pt = path.getPointAtLength(l); var d = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y); if (d < bd) { bd = d; best = l; } }
      return best / L;
    });
    if (reduce) { stops.forEach(function (st) { st.classList.add('on'); }); return; }
    path.style.strokeDasharray = L + ' ' + L;
    path.style.strokeDashoffset = L;
    journeys.push({ update: function () {
      var r = root.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.min(1, Math.max(0, (vh * 0.62 - r.top) / (r.height * 0.92)));
      path.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      var pt = path.getPointAtLength(L * p);
      tip.setAttribute('cx', pt.x.toFixed(1)); tip.setAttribute('cy', pt.y.toFixed(1));
      root.classList.toggle('drawing', p > 0.002 && p < 0.998);
      stops.forEach(function (st, i) { st.classList.toggle('on', p >= fr[i] - 0.005 || (i === 0 && p > 0)); });
    }});
  });

  /* Projets : fiches empilées, clic sur un onglet pour revenir à une fiche */
  document.querySelectorAll('[data-stack]').forEach(function (root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('.card'));
    var num = function (el, prop) { return parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0; };
    var stickTop = function (i) { return num(root, '--stick') + i * num(root, '--tab'); };
    var naturalTop = function (i) {
      var top = root.getBoundingClientRect().top + window.scrollY, gap = num(root, 'row-gap') || num(root, 'gap');
      for (var k = 0; k < i; k++) top += cards[k].offsetHeight + gap;
      return top;
    };
    root.querySelectorAll('[data-goto]').forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.getAttribute('data-goto');
        window.scrollTo({ top: Math.max(0, naturalTop(i) - stickTop(i)), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    stacks.push({ update: function () {
      var top = 0;
      cards.forEach(function (c, i) { if (c.getBoundingClientRect().top <= stickTop(i) + 2) top = i; });
      cards.forEach(function (c, i) { c.classList.toggle('is-top', i === top); });
    }});
  });

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* 5. Menu mobile */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = doc.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { doc.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); });
    });
  }

  /* 6. Carrousel : flèches, glisser à la souris, barre de progression */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.carousel');
    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('.car-dots');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    var dots = slides.map(function (sl, i) {
      if (!dotsBox) return null;
      var d = document.createElement('button'); d.type = 'button';
      d.setAttribute('aria-label', 'Aller à la publication ' + (i + 1));
      d.addEventListener('click', function () { track.scrollTo({ left: sl.offsetLeft - slides[0].offsetLeft, behavior: 'smooth' }); });
      dotsBox.appendChild(d); return d;
    });
    var step = function () { var s = track.querySelector('.slide'); return s ? s.getBoundingClientRect().width + 18 : 300; };
    var update = function () {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      var cur = 0, x = track.scrollLeft + 10;
      slides.forEach(function (sl, i) { if (sl.offsetLeft - slides[0].offsetLeft <= x) cur = i; });
      if (track.scrollLeft > max - 5) cur = slides.length - 1;
      dots.forEach(function (d, i) { if (d) d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
      if (prev) prev.disabled = track.scrollLeft < 5;
      if (next) next.disabled = track.scrollLeft > max - 5;
    };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    update();

    // glisser à la souris
    var down = false, startX = 0, startL = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startL = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 5) { moved = true; track.classList.add('dragging'); }
      track.scrollLeft = startL - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) {
        track.classList.remove('dragging');
        var s = step(); track.scrollTo({ left: Math.round(track.scrollLeft / s) * s, behavior: 'smooth' });
      }
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  });

  /* 7. Vidéos : lecture seulement quand elles sont visibles */
  var vids = document.querySelectorAll('video[data-auto]');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
      });
    }, { threshold: 0.25 });
    vids.forEach(function (v) { v.muted = true; vio.observe(v); });
  }

  /* 8. Lecteur plein écran avec le son */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbVideo = lb.querySelector('video');
    var lastBtn = null;
    var close = function () {
      lb.classList.remove('open'); lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load();
      if (lastBtn) lastBtn.focus();
    };
    document.querySelectorAll('[data-open-video]').forEach(function (b) {
      b.addEventListener('click', function () {
        lastBtn = b;
        lbVideo.src = b.getAttribute('data-open-video');
        lb.classList.add('open');
        lbVideo.play().catch(function () {});
        lb.querySelector('.close').focus();
      });
    });
    lb.querySelector('.close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }

  /* Copier l'adresse e-mail */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var label = b.querySelector('span'), txt = label ? label.textContent : '';
    b.addEventListener('click', function () {
      var val = b.getAttribute('data-copy');
      var ok = function () { b.classList.add('done'); if (label) label.textContent = 'Adresse copiée'; setTimeout(function () { b.classList.remove('done'); if (label) label.textContent = txt; }, 2200); };
      var fallback = function () {
        var t = document.createElement('textarea'); t.value = val; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); ok(); } catch (err) { if (label) label.textContent = val; }
        document.body.removeChild(t);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(val).then(ok, fallback); } else { fallback(); }
    });
  });

  /* 9. Curseur personnalisé (ordinateur uniquement) */
  var cursor = document.querySelector('.cursor');
  if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    var label = cursor.querySelector('span');
    var cx = -100, cy = -100, tx = -100, ty = -100;
    document.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY; cursor.style.opacity = 1; cursor.classList.add('on'); });
    document.addEventListener('pointerleave', function () { cursor.style.opacity = 0; });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () { label.textContent = el.getAttribute('data-cursor'); cursor.classList.add('big'); });
      el.addEventListener('pointerleave', function () { cursor.classList.remove('big'); });
    });
  } else if (cursor) { cursor.style.display = 'none'; }

  /* 10. Transition de page (rideau prune) sur les liens internes */
  var curtain = document.querySelector('.curtain');
  document.querySelectorAll('a[href]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(mailto|tel|https?):/.test(href) || a.hasAttribute('download') || a.target === '_blank') return;
    a.addEventListener('click', function (e) {
      if (reduce || !curtain || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      curtain.classList.add('closing');
      setTimeout(function () { window.location.href = href; }, 550);
    });
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted && curtain) curtain.classList.remove('closing'); });
})();
