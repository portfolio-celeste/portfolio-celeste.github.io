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
    // la bulle s'écarte vers le haut si elle passe sur une flèche du carrousel
    if (bubble) {
      var shift = 0, bb = bubble.getBoundingClientRect(), base = bb.top - (parseFloat(bubble.dataset.shift) || 0);
      document.querySelectorAll('.car-arrow').forEach(function (ar) {
        var a = ar.getBoundingClientRect();
        if (a.width && a.right > bb.left && a.left < bb.right && a.bottom + 16 > base && a.top - 16 < base + bb.height) shift = Math.min(shift, a.top - 16 - (base + bb.height));
      });
      bubble.dataset.shift = shift;
      bubble.style.translate = '0 ' + shift + 'px';
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

  /* 6. Carrousel en manège : la publication choisie au centre, les autres tournent autour */
  document.querySelectorAll('[data-carousel]').forEach(function (root) {
    var track = root.querySelector('.orbit');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    var n = slides.length, active = 0;
    var prev = root.querySelector('[data-prev]'), next = root.querySelector('[data-next]');
    var dotsBox = root.querySelector('.car-dots');
    var inView = false, hoverTimer = null, lockX = null, isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var dots = slides.map(function (sl, i) {
      if (!dotsBox) return null;
      var d = document.createElement('button'); d.type = 'button';
      d.setAttribute('aria-label', 'Afficher la publication ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      dotsBox.appendChild(d); return d;
    });
    var layout = function () {
      var w = slides[0].offsetWidth;
      var X = [0, w * 0.95, w * 1.7, w * 2.2], Z = [60, -230, -520, -760], ROT = [0, 26, 36, 44];
      slides.forEach(function (sl, i) {
        var d = i - active;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;
        var ad = Math.abs(d), k = Math.min(ad, 3), sg = d < 0 ? -1 : 1;
        sl.style.transform = 'translate3d(' + (sg * X[k]).toFixed(1) + 'px,0,' + Z[k] + 'px) rotateY(' + (sg * ROT[k]) + 'deg)';
        sl.style.filter = ad === 0 ? 'none' : 'blur(' + (ad === 1 ? 2.2 : 3.6) + 'px) saturate(.85)';
        sl.style.opacity = ad === 0 ? 1 : ad === 1 ? 0.88 : ad === 2 ? 0.55 : 0;
        sl.style.zIndex = 20 - ad;
        sl.style.pointerEvents = ad > 2 ? 'none' : '';
        sl.classList.toggle('is-active', ad === 0);
        sl.setAttribute('aria-hidden', ad === 0 ? 'false' : 'true');
      });
      dots.forEach(function (d, i) { if (d) d.setAttribute('aria-current', i === active ? 'true' : 'false'); });
      playActive();
    };
    var playActive = function () {
      slides.forEach(function (sl, i) {
        var v = sl.querySelector('video');
        if (!v) return;
        if (i === active && inView && !reduce) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else v.pause();
      });
    };
    var go = function (i) { active = (i + n) % n; layout(); };
    if (prev) prev.addEventListener('click', function () { go(active - 1); });
    if (next) next.addEventListener('click', function () { go(active + 1); });
    // clic sur une publication du côté : elle vient au centre
    slides.forEach(function (sl, i) {
      sl.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); return; } if (i !== active) { e.preventDefault(); go(i); } });
    });
    // survol d'une publication du côté : le manège tourne (ordinateur)
    if (isFine && !reduce) {
      track.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (lockX !== null && Math.abs(e.clientX - lockX) < 40) return;
        lockX = null;
        var sl = e.target.closest && e.target.closest('.slide');
        var i = slides.indexOf(sl);
        clearTimeout(hoverTimer);
        if (i < 0 || i === active) return;
        hoverTimer = setTimeout(function () { lockX = e.clientX; go(i); }, 260);
      });
      track.addEventListener('pointerleave', function () { clearTimeout(hoverTimer); lockX = null; });
    }
    // glisser au doigt ou à la souris
    var sx = null, swiped = false;
    track.addEventListener('pointerdown', function (e) { sx = e.clientX; swiped = false; });
    track.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 45) { swiped = true; go(active + (dx < 0 ? 1 : -1)); setTimeout(function () { swiped = false; }, 50); }
    });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { go(active + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { go(active - 1); e.preventDefault(); }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { inView = en[0].isIntersecting; playActive(); }, { threshold: 0.2 }).observe(track);
    } else { inView = true; }
    window.addEventListener('resize', layout);
    layout();
  });

  /* 7. Vidéos hors carrousel : lecture seulement quand elles sont visibles */
  var vids = Array.prototype.filter.call(document.querySelectorAll('video[data-auto]'), function (v) { return !v.closest('.orbit'); });
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
      lb.classList.remove('open'); lbVideo.pause(); lbVideo.removeAttribute('src'); lbVideo.load(); var li = lb.querySelector('.lb-img'); if (li) { li.hidden = true; li.removeAttribute('src'); }
      if (lastBtn) lastBtn.focus();
    };
    var lbImg = lb.querySelector('.lb-img');
    var openMedia = function (from, video, img, alt) {
      lastBtn = from;
      if (video) {
        if (lbImg) lbImg.hidden = true;
        lbVideo.hidden = false; lbVideo.src = video;
        lb.classList.add('open'); lbVideo.play().catch(function () {});
      } else if (img && lbImg) {
        lbVideo.hidden = true; lbImg.hidden = false; lbImg.src = img; lbImg.alt = alt || '';
        lb.classList.add('open');
      }
      lb.querySelector('.close').focus();
    };
    document.querySelectorAll('[data-open-video]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); openMedia(b, b.getAttribute('data-open-video')); });
    });
    document.querySelectorAll('[data-open]').forEach(function (z) {
      z.addEventListener('click', function () {
        var sl = z.closest('.slide');
        if (sl && sl.closest('.orbit') && !sl.classList.contains('is-active')) return;
        var btn = z.querySelector('[data-open-video]'), im = z.querySelector('img');
        if (btn) openMedia(btn, btn.getAttribute('data-open-video'));
        else if (im) openMedia(z, null, im.currentSrc || im.src, im.alt);
      });
    });
    lb.querySelector('.close').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }

  /* Bouton pour remonter tout en haut */
  var toTop = document.querySelector('.to-top');
  document.querySelectorAll('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  });
  if (toTop) {
    var tt = function () { toTop.classList.toggle('show', window.scrollY > 700); };
    window.addEventListener('scroll', tt, { passive: true }); tt();
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
