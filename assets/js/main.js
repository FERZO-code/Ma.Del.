/* Ma.Del. srl — interazioni del sito */
(() => {
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Tracciamento contatti: compatibile con Google Tag Manager / GA4 (dataLayer)
  window.dataLayer = window.dataLayer || [];
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (el) window.dataLayer.push({ event: 'contatto', metodo: el.dataset.track });
  });

  /* ---------- Intro ---------- */
  const intro = $('#intro');
  const startPage = () => {
    doc.classList.add('intro-over');
    requestAnimationFrame(() => doc.classList.add('ready'));
  };
  if (doc.classList.contains('no-intro') || !intro) {
    startPage();
  } else {
    const deg = $('#intro-deg');
    const t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0 - 450) / 1300));
      deg.textContent = Math.round(14 + (1 - Math.pow(1 - k, 3)) * 10);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      intro.classList.add('is-done');
      try { sessionStorage.setItem('madel-intro', '1'); } catch (e) {}
    };
    // la pagina entra mentre il cerchio si chiude
    const pageTimer = setTimeout(startPage, 2350);
    intro.addEventListener('animationend', (e) => { if (e.animationName === 'intro-out') finish(); });
    setTimeout(finish, 3400);
    // clic o tasto per saltare
    const skip = () => { clearTimeout(pageTimer); intro.style.animation = 'intro-out .45s cubic-bezier(.2,.7,.1,1) forwards'; startPage(); };
    intro.addEventListener('click', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
  }

  /* ---------- Header ---------- */
  const header = $('.site-header');
  const dock = $('.dock');
  const hero = $('.hero');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 24);
    if (dock) dock.classList.toggle('is-visible', y > hero.offsetHeight * 0.55);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('[data-menu]');
  const setMenu = (open) => {
    doc.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.sr', menuBtn).textContent = open ? 'Chiudi menu' : 'Menu';
  };
  addEventListener('resize', () => { if (innerWidth > 1080) setMenu(false); });
  menuBtn.addEventListener('click', () => setMenu(!doc.classList.contains('menu-open')));
  $$('#nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Ufficio aperto / chiuso (ora di Roma) ---------- */
  const DAYS = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  const SLOTS = [[570, 750], [1050, 1170]]; // 9:30–12:30, 17:30–19:30
  const fmt = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const updateStatus = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    const min = +parts.hour * 60 + +parts.minute;
    const workday = day >= 1 && day <= 5;
    const open = workday && SLOTS.some(([a, b]) => min >= a && min < b);
    let text;
    if (open) {
      const end = SLOTS.find(([a, b]) => min >= a && min < b)[1];
      text = `Ufficio aperto · fino alle ${fmt(end)}`;
    } else {
      const later = workday && SLOTS.find(([a]) => min < a);
      if (later) text = `Chiuso · riapre alle ${fmt(later[0])}`;
      else {
        let d = (day + 1) % 7;
        while (d === 0 || d === 6) d = (d + 1) % 7;
        text = `Chiuso · riapre ${d === (day + 1) % 7 ? 'domani' : DAYS[d]} alle 9:30`;
      }
    }
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', open);
      $('[data-status-text]', el).textContent = text;
    });
  };
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Termostato dei servizi ---------- */
  const section = $('#servizi');
  const dial = $('#dial');
  const ticks = $('.dial-ticks');
  const MIN = 14, MAX = 30, SWEEP = 270;
  const stops = $$('[data-stop]').map((b) => ({ id: b.dataset.stop, t: +b.dataset.temp, btn: b }));
  const toAngle = (t) => -SWEEP / 2 + ((t - MIN) / (MAX - MIN)) * SWEEP;
  const NS = 'http://www.w3.org/2000/svg';
  const tickEls = [];
  for (let t = MIN; t <= MAX; t += 0.5) {
    const a = (toAngle(t) - 90) * Math.PI / 180;
    const major = Number.isInteger(t) && t % 2 === 0;
    const r1 = major ? 176 : 182, r2 = 192;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 200 + r1 * Math.cos(a)); l.setAttribute('y1', 200 + r1 * Math.sin(a));
    l.setAttribute('x2', 200 + r2 * Math.cos(a)); l.setAttribute('y2', 200 + r2 * Math.sin(a));
    if (major) l.classList.add('major');
    l.dataset.t = t;
    ticks.appendChild(l);
    tickEls.push(l);
  }

  // scala termica: freddo -> caldo (stessi colori della ghiera in CSS)
  const SCALE = [[16, [47, 123, 224]], [20, [26, 155, 176]], [24, [240, 144, 30]], [28, [232, 67, 46]]];
  const colorAt = (t) => {
    let i = 0;
    while (i < SCALE.length - 2 && t > SCALE[i + 1][0]) i++;
    const [t1, c1] = SCALE[i], [t2, c2] = SCALE[i + 1];
    const k = Math.min(1, Math.max(0, (t - t1) / (t2 - t1)));
    return `rgb(${c1.map((v, j) => Math.round(v + (c2[j] - v) * k)).join(' ')})`;
  };

  let current = 24;
  const nearest = (t) => stops.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a));
  const render = (t) => {
    section.style.setProperty('--accent', colorAt(t));
    dial.style.setProperty('--angle', `${toAngle(t)}deg`);
    $('[data-dial-temp]').textContent = Math.round(t);
    tickEls.forEach((l) => l.classList.toggle('on', +l.dataset.t <= t));
  };
  const select = (stop, focusPanel) => {
    current = stop.t;
    render(stop.t);
    stops.forEach((s) => s.btn.setAttribute('aria-pressed', String(s === stop)));
    $('[data-dial-name]').textContent = stop.btn.textContent.replace('Riscaldamento a ', '');
    dial.setAttribute('aria-valuenow', stop.t);
    dial.setAttribute('aria-valuetext', stop.btn.textContent);
    $$('[data-panel]').forEach((p) => {
      const on = p.dataset.panel === stop.id;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
    if (focusPanel && innerWidth <= 900) $(`[data-panel="${stop.id}"]`).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  stops.forEach((s) => s.btn.addEventListener('click', () => select(s, true)));
  dial.addEventListener('keydown', (e) => {
    const i = stops.findIndex((s) => s.t === current);
    let n = null;
    if (['ArrowRight', 'ArrowUp'].includes(e.key)) n = Math.min(stops.length - 1, i + 1);
    if (['ArrowLeft', 'ArrowDown'].includes(e.key)) n = Math.max(0, i - 1);
    if (e.key === 'Home') n = 0;
    if (e.key === 'End') n = stops.length - 1;
    if (n !== null) { e.preventDefault(); select(stops[n]); }
  });

  // trascinamento della manopola
  const tempFromPointer = (e) => {
    const r = dial.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    let ang = Math.atan2(dx, -dy) * 180 / Math.PI;
    ang = Math.max(-SWEEP / 2, Math.min(SWEEP / 2, ang));
    return Math.max(16, Math.min(28, MIN + ((ang + SWEEP / 2) / SWEEP) * (MAX - MIN)));
  };
  let dragging = false, lastStop = null;
  dial.addEventListener('pointerdown', (e) => {
    dragging = true;
    dial.setPointerCapture(e.pointerId);
    dial.classList.add('is-dragging');
    const t = tempFromPointer(e);
    render(t);
    lastStop = nearest(t);
  });
  dial.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const t = tempFromPointer(e);
    render(t);
    const s = nearest(t);
    if (s !== lastStop) { lastStop = s; select(s); render(t); }
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    dial.classList.remove('is-dragging');
    select(lastStop);
  };
  dial.addEventListener('pointerup', endDrag);
  dial.addEventListener('pointercancel', endDrag);
  select(stops.find((s) => s.t === 24));

  // i CTA dei servizi preselezionano il form
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => {
    const r = $(`input[name="servizio"][value="${a.dataset.pick}"]`);
    if (r) r.checked = true;
  }));

  /* ---------- Rivelazioni allo scroll e contatori ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach((el) => { if (!el.closest('.hero')) io.observe(el); });

  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, it = el.dataset.format === 'it';
      if (reduced) return;
      const t0 = performance.now(), dur = 1400;
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = it ? v.toLocaleString('it-IT') : v;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- Galleria lavori ---------- */
  const track = $('#works');
  $$('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
    track.scrollBy({ left: +b.dataset.scroll * track.clientWidth * 0.7, behavior: reduced ? 'auto' : 'smooth' });
  }));
  const lb = $('#lightbox');
  $$('[data-full]').forEach((b) => b.addEventListener('click', () => {
    const img = $('img', lb);
    img.src = b.dataset.full;
    img.alt = $('img', b).alt;
    $('.lightbox-cap', lb).textContent = b.nextElementSibling.textContent;
    lb.showModal();
  }));
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

  /* ---------- Form richiesta di richiamata ---------- */
  const form = $('#form');
  const WA = '393477531355';
  const MAIL = 'info@madelsas.it';
  const validate = () => {
    let ok = true;
    ['nome', 'telefono'].forEach((n) => {
      const input = form.elements[n];
      const valid = input.value.trim() !== '' && input.checkValidity();
      input.closest('.field').classList.toggle('is-invalid', !valid);
      if (!valid && ok) { input.focus(); ok = false; }
    });
    const consent = form.elements.privacy.checked;
    $('.err-consent', form).classList.toggle('is-shown', !consent);
    return ok && consent;
  };
  $$('input', form).forEach((i) => i.addEventListener('input', () => i.closest('.field')?.classList.remove('is-invalid')));
  form.elements.privacy.addEventListener('change', () => $('.err-consent', form).classList.remove('is-shown'));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    const f = form.elements;
    const lines = [
      'Buongiorno, vorrei essere ricontattato.',
      `Servizio: ${f.servizio.value}`,
      `Intervento: ${f.tipo.value}`,
      `Nome: ${f.nome.value.trim()}`,
      `Telefono: ${f.telefono.value.trim()}`,
      f.comune.value.trim() && `Comune: ${f.comune.value.trim()}`,
      `Richiamatemi: ${f.quando.value}`,
      f.note.value.trim() && `Dettagli: ${f.note.value.trim()}`,
    ].filter(Boolean);
    const text = lines.join('\n');
    const via = e.submitter?.value || 'whatsapp';
    window.dataLayer.push({ event: 'richiesta_inviata', metodo: via, servizio: f.servizio.value });
    const done = $('.form-done', form);
    if (via === 'email') {
      location.href = `mailto:${MAIL}?subject=${encodeURIComponent(`Richiesta di contatto · ${f.servizio.value}`)}&body=${encodeURIComponent(text)}`;
      done.textContent = 'Si è aperta la tua app email con il messaggio pronto: premi Invia per mandarcelo.';
    } else {
      window.open(`https://wa.me/${WA}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      done.textContent = 'Si è aperto WhatsApp con il messaggio pronto: premi Invia per mandarcelo.';
    }
    done.hidden = false;
  });

  /* ---------- Video ---------- */
  // Reel nell'hero: parte in silenzio dopo il caricamento, mai con risparmio dati o "riduci movimento"
  const heroVideo = $('.hero-video');
  const pauseBtn = $('.hero-pause');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (heroVideo && !reduced && !saveData) {
    const startReel = () => {
      heroVideo.src = heroVideo.dataset.src;
      heroVideo.play().catch(() => {});
    };
    if (document.readyState === 'complete') setTimeout(startReel, 600);
    else addEventListener('load', () => setTimeout(startReel, 600), { once: true });
    heroVideo.addEventListener('playing', () => { heroVideo.classList.add('is-playing'); pauseBtn.hidden = false; });
    pauseBtn.addEventListener('click', () => {
      const paused = heroVideo.paused;
      if (paused) heroVideo.play(); else heroVideo.pause();
      pauseBtn.setAttribute('aria-label', paused ? 'Metti in pausa il video' : 'Riproduci il video');
      $('use', pauseBtn).setAttribute('href', paused ? '#i-pause' : '#i-play');
    });
  }

  // Video del cantiere: si carica solo quando si preme play
  const player = $('.player');
  if (player) {
    const film = $('video', player);
    $('.player-play', player).addEventListener('click', () => {
      player.classList.add('is-started');
      film.controls = true;
      film.play();
      film.focus();
    });
  }

  const year = $('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
