/* Chloé Chabbert — portfolio : interactions */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  if (!hasIO) { root.classList.add('reveal-all'); }

  /* ---------- 1. Effet machine à écrire ---------- */
  const typed = document.querySelector('.typed');
  if (typed && !reduced) {
    const words = typed.dataset.words.split('|');
    let w = 0, i = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      if (deleting) {
        i--;
        typed.textContent = word.slice(0, i);
        if (i === 0) { deleting = false; w = (w + 1) % words.length; }
        setTimeout(tick, 45);
      } else {
        const next = words[w];
        i++;
        typed.textContent = next.slice(0, i);
        if (i === next.length) { deleting = true; setTimeout(tick, 1800); }
        else setTimeout(tick, 85);
      }
    };
    setTimeout(tick, 2200);
  }

  /* ---------- 2. Filtre de profil (comme un segment Power BI) ---------- */
  const KPI_EN = {
    all: {
      'a-fig': '3.5 years', 'a-cap': 'of BI in industry, from internship to Data Engineer',
      'b-fig': '12 years',  'b-cap': 'of websites, logos and videos, since 2014'
    },
    data: {
      'a-fig': '3',       'a-cap': 'companies where I have worked on data: KPC Sud Ouest, Puy du Fou, K-LINE',
      'b-fig': '5 years', 'b-cap': 'of higher education, up to a Master’s in business computing (BI track), University of Bordeaux'
    },
    web: {
      'a-fig': '12 years', 'a-cap': 'of designing websites, logos and videos, since 2014',
      'b-fig': '2',        'b-cap': 'client regions: mainland France and French Polynesia'
    }
  };
  const KPI_FR = {
    all: {
      'a-fig': '3,5 ans', 'a-cap': 'de BI en entreprise, du stage au poste de Data Engineer',
      'b-fig': '12 ans',  'b-cap': 'de sites web, logos et vidéos, depuis 2014'
    },
    data: {
      'a-fig': '3',     'a-cap': 'entreprises où j’ai fait de la data : KPC Sud Ouest, Puy du Fou, K-LINE',
      'b-fig': 'Bac+5', 'b-cap': 'Master 2 MIAGE, parcours business intelligence, Université de Bordeaux'
    },
    web: {
      'a-fig': '12 ans', 'a-cap': 'de création de sites, de logos et de vidéos, depuis 2014',
      'b-fig': '2',      'b-cap': 'territoires de clients : la France et la Polynésie française'
    }
  };
  const KPI = root.lang.startsWith('en') ? KPI_EN : KPI_FR;
  const tiles = document.querySelectorAll('.tile');
  const setView = (view) => {
    if (document.body.dataset.view === view) return;
    document.body.dataset.view = view;
    document.querySelectorAll('[data-set-view]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.setView === view)));
    tiles.forEach(t => t.classList.add('is-swapping'));
    setTimeout(() => {
      Object.entries(KPI[view]).forEach(([k, v]) => {
        const el = document.querySelector(`[data-kpi="${k}"]`);
        if (el) el.textContent = v;
      });
      tiles.forEach(t => t.classList.remove('is-swapping'));
    }, reduced ? 0 : 250);
    // Les éléments masqués/affichés doivent apparaître tout de suite
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
    });
    updateScenes();
    updateQuery(view, true);
  };

  /* La requête SQL affichée sous le filtre : elle dit, en code, ce que le filtre vient de faire */
  const queryEl = document.getElementById('query');
  const en = root.lang.startsWith('en');
  let queryTimer;
  function updateQuery(view, animate) {
    if (!queryEl) return;
    const table = en ? 'career' : 'parcours', col = en ? 'profile' : 'profil';
    const count = [...document.querySelectorAll('.entry, .row')].filter(el => el.offsetParent !== null).length;
    const where = view === 'all' ? '' : ` WHERE ${col} = '${view}'`;
    const plain = `SELECT * FROM ${table}${where};\n-- ${count} ${en ? 'rows' : 'résultats'}`;
    const html = `<span class="kw">SELECT</span> * <span class="kw">FROM</span> ${table}`
      + (view === 'all' ? '' : ` <span class="kw">WHERE</span> ${col} = <span class="str">'${view}'</span>`)
      + `;\n-- ${count} ${en ? 'rows' : 'résultats'}`;
    clearInterval(queryTimer);
    if (!animate || reduced) { queryEl.innerHTML = html; return; }
    let i = 0;
    queryTimer = setInterval(() => {
      i += 2;
      queryEl.textContent = plain.slice(0, i);
      if (i >= plain.length) { clearInterval(queryTimer); queryEl.innerHTML = html; }
    }, 16);
  }
  updateQuery('all', false);

  document.querySelectorAll('[data-set-view]').forEach(b =>
    b.addEventListener('click', () => setView(b.dataset.setView)));

  /* ---------- 3. Filtre flottant, visible une fois l'accueil passé ---------- */
  const home = document.getElementById('slicer-home');
  const float = document.getElementById('slicer-float');
  const ends = [document.querySelector('.contact'), document.querySelector('.foot')];
  if (hasIO && home && float) {
    let pastHome = false; const endSeen = new Set();
    const sync = () => {
      const show = pastHome && endSeen.size === 0;
      float.classList.toggle('is-shown', show);
      float.setAttribute('aria-hidden', String(!show));
      float.querySelectorAll('button').forEach(b => b.tabIndex = show ? 0 : -1);
    };
    new IntersectionObserver(([e]) => {
      pastHome = !e.isIntersecting && e.boundingClientRect.top < 0; sync();
    }).observe(home);
    const endIO = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? endSeen.add(e.target) : endSeen.delete(e.target)); sync();
    }, { rootMargin: '0px 0px 120px 0px' });
    ends.forEach(el => el && endIO.observe(el));
  }

  /* ---------- 4. La photo fixe change avec la section lue ---------- */
  const splits = [...document.querySelectorAll('.split')];
  function updateScenes() {
    const mid = innerHeight * 0.5;
    splits.forEach(split => {
      const triggers = [...split.querySelectorAll('[data-scene]')]
        .filter(el => el.offsetParent !== null);
      let current = null;
      for (const el of triggers) {
        if (el.getBoundingClientRect().top <= mid) current = el;
      }
      if (!current) current = triggers[0];
      if (!current) return;
      const name = current.dataset.scene;
      split.querySelectorAll('.scene').forEach(fig =>
        fig.classList.toggle('is-on', fig.dataset.sceneImg === name));
    });
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateScenes(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', updateScenes);
  updateScenes();

  /* ---------- 5. Atelier : bandes d'images à faire défiler ---------- */
  document.querySelectorAll('.strip').forEach(strip => {
    const rail = strip.querySelector('.strip__rail');
    const nav = strip.querySelector('.strip__nav');
    const fit = () => { nav.hidden = rail.scrollWidth <= rail.clientWidth + 4; };
    fit(); addEventListener('resize', fit); addEventListener('load', fit);
    strip.querySelectorAll('.strip__nav button').forEach(btn => btn.addEventListener('click', () => {
      rail.scrollBy({ left: Number(btn.dataset.dir) * rail.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
    }));
  });

  /* ---------- 6. Agrandissement d'une image ---------- */
  const box = document.getElementById('lightbox');
  if (box && typeof box.showModal === 'function') {
    const img = document.getElementById('lightbox-img'), cap = document.getElementById('lightbox-cap');
    let group = [], index = 0;
    const show = (k) => {
      index = (k + group.length) % group.length;
      const a = group[index];
      img.src = a.href; img.alt = a.dataset.caption; img.width = a.dataset.w; img.height = a.dataset.h;
      cap.textContent = `${a.dataset.caption} · ${index + 1} / ${group.length}`;
    };
    document.querySelectorAll('a[data-zoom]').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      group = [...a.closest('.strip__rail').querySelectorAll('a[data-zoom]')];
      show(group.indexOf(a));
      box.showModal();
    }));
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-lb]');
      if (b) { b.dataset.lb === 'close' ? box.close() : show(index + (b.dataset.lb === 'next' ? 1 : -1)); return; }
      if (e.target === box) box.close();   // clic sur le fond
    });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
    box.addEventListener('close', () => { img.removeAttribute('src'); });
  }

  /* ---------- 7. Carte des voyages : un point et sa ligne dans la liste s'allument ensemble ---------- */
  const travel = document.querySelector('.travel');
  if (travel) {
    const mark = (key, on) => travel.querySelectorAll(`[data-place="${key}"]`).forEach(el => el.classList.toggle('is-active', on));
    let pinned = null;
    travel.querySelectorAll('[data-place]').forEach(el => {
      const key = el.dataset.place;
      el.addEventListener('pointerenter', () => mark(key, true));
      el.addEventListener('pointerleave', () => { if (pinned !== key) mark(key, false); });
      el.addEventListener('focus', () => mark(key, true));
      el.addEventListener('blur', () => { if (pinned !== key) mark(key, false); });
      el.addEventListener('click', () => {
        if (pinned && pinned !== key) mark(pinned, false);
        pinned = pinned === key ? null : key;
        mark(key, pinned === key);
        if (pinned && el.classList.contains('pin') && matchMedia('(max-width: 900px)').matches) {
          const row = travel.querySelector(`li[data-place="${key}"]`);
          if (row) row.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    });
  }

  /* ---------- 8. Apparition des éléments, en cascade ---------- */
  if (hasIO) {
    const io = new IntersectionObserver(entries => {
      const batch = entries.filter(e => e.isIntersecting);
      batch.forEach((e, k) => {
        e.target.style.setProperty('--d', `${Math.min(k, 6) * 75}ms`);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
})();
