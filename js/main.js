/* Lo Style E L'extro — interfaccia, prenotazione, scroll dell'hero */
(function () {
  'use strict';

  var WHATSAPP = '393388582992';
  var PHONE = '+39 338 858 2992';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero: avanzamento dello scorrimento ---------- */
  var hero = document.getElementById('hero');
  var nav = document.getElementById('nav');
  var bar = document.getElementById('heroProgress');
  var hint = document.getElementById('heroHint');
  var lines = Array.prototype.slice.call(document.querySelectorAll('.hero__line'));

  // Stato condiviso con il video (js/hero.js)
  var state = window.heroState = { target: 0, p: 0 };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }

  function readScroll() {
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    state.target = total > 0 ? clamp(-rect.top / total, 0, 1) : 0;
    // Barra trasparente sopra l'animazione, poi bianca con sfocatura
    var navSolid = rect.bottom <= nav.offsetHeight + 1 || document.body.classList.contains('no-video') && window.scrollY > 20;
    nav.classList.toggle('is-solid', navSolid);
  }

  function renderOverlay(p) {
    bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    hint.style.opacity = p > 0.03 ? 0 : 1;
    for (var i = 0; i < lines.length; i++) {
      var el = lines[i];
      var from = parseFloat(el.dataset.from);
      var to = parseFloat(el.dataset.to);
      var fade = 0.05;
      var inV = from <= 0 ? 1 : smooth(from, from + fade, p);
      var outV = to >= 1 ? 1 : 1 - smooth(to - fade, to, p);
      var o = Math.min(inV, outV);
      var y = (1 - inV) * 26 - (1 - outV) * 26;
      el.style.opacity = o.toFixed(3);
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      el.classList.toggle('is-active', o > 0.5);
      el.setAttribute('aria-hidden', o > 0.5 ? 'false' : 'true');
    }
  }

  var lastDrawn = -1;
  function tick() {
    var k = reduceMotion ? 1 : 0.12;
    state.p += (state.target - state.p) * k;
    if (Math.abs(state.target - state.p) < 0.0004) state.p = state.target;
    if (Math.abs(state.p - lastDrawn) > 0.0001) {
      renderOverlay(state.p);
      lastDrawn = state.p;
    }
    requestAnimationFrame(tick);
  }

  window.addEventListener('scroll', readScroll, { passive: true });
  window.addEventListener('resize', readScroll);
  readScroll();
  state.p = state.target;
  renderOverlay(state.p);
  requestAnimationFrame(tick);

  /* ---------- Menu mobile ---------- */
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('menu');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Comparsa morbida delle sezioni ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Orari: evidenzia oggi ---------- */
  var today = new Date().getDay();
  document.querySelectorAll('#hours li').forEach(function (li) {
    var d = parseInt(li.dataset.day, 10);
    if (d === 0 || d === 1) li.classList.add('is-closed');
    if (d === today) li.classList.add('is-today');
  });

  /* ---------- Toast ---------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
  }

  /* ---------- Copia numero ---------- */
  var copyBtn = document.getElementById('copyPhone');
  copyBtn.addEventListener('click', function () {
    function done() {
      copyBtn.textContent = 'Copiato ✓';
      showToast('Numero copiato: 338 858 2992');
      setTimeout(function () { copyBtn.textContent = 'Copia numero'; }, 2200);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = PHONE;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { showToast('Numero: 338 858 2992'); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(PHONE).then(done, fallback);
    } else {
      fallback();
    }
  });

  /* ---------- Prenotazione ---------- */
  var form = document.getElementById('bookingForm');
  var dateInput = document.getElementById('giorno');
  var timeSelect = document.getElementById('orario');
  var summary = document.getElementById('summary');
  var summaryList = document.getElementById('summaryList');
  var waLink = document.getElementById('waLink');

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // Orari: dalle 8:30 alle 18:00 ogni 30 minuti
  for (var mins = 8 * 60 + 30; mins <= 18 * 60; mins += 30) {
    var label = Math.floor(mins / 60) + ':' + pad(mins % 60);
    var opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    timeSelect.appendChild(opt);
  }

  var now = new Date();
  var todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  dateInput.min = isoDate(todayMidnight);
  var maxDate = new Date(todayMidnight);
  maxDate.setDate(maxDate.getDate() + 90);
  dateInput.max = isoDate(maxDate);

  function setError(name, msg) {
    var p = form.querySelector('[data-error="' + name + '"]');
    if (p) {
      p.textContent = msg || '';
      var field = p.closest('.field');
      if (field) field.classList.toggle('has-error', !!msg);
    }
  }

  function validateDate() {
    var d = parseDate(dateInput.value);
    if (!d) { setError('giorno', 'Scegli il giorno.'); return false; }
    var dow = d.getDay();
    if (dow === 1) { setError('giorno', 'Il lunedì siamo chiusi: scegli un giorno dal martedì al sabato.'); return false; }
    if (dow === 0) { setError('giorno', 'La domenica siamo chiusi: scegli un giorno dal martedì al sabato.'); return false; }
    if (d < todayMidnight) { setError('giorno', 'Questa data è già passata: scegline una a partire da oggi.'); return false; }
    setError('giorno', '');
    return true;
  }

  function validateTime() {
    if (!timeSelect.value) { setError('orario', "Scegli l'orario."); return false; }
    var d = parseDate(dateInput.value);
    if (d && d.getTime() === todayMidnight.getTime()) {
      var parts = timeSelect.value.split(':');
      var slot = new Date(d);
      slot.setHours(+parts[0], +parts[1]);
      if (slot <= new Date()) { setError('orario', 'Questo orario è già passato: scegline uno più tardi.'); return false; }
    }
    setError('orario', '');
    return true;
  }

  dateInput.addEventListener('change', function () { validateDate(); if (timeSelect.value) validateTime(); });
  timeSelect.addEventListener('change', validateTime);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'servizio') setError('servizio', '');
  });
  ['nome', 'telefono'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () { setError(id, ''); });
  });

  function formatDay(d) {
    var s = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    var service = form.querySelector('input[name="servizio"]:checked');
    if (!service) { setError('servizio', 'Scegli un servizio.'); ok = false; } else setError('servizio', '');
    if (!validateDate()) ok = false;
    if (!validateTime()) ok = false;

    var nome = document.getElementById('nome').value.trim();
    var tel = document.getElementById('telefono').value.trim();
    var note = document.getElementById('note').value.trim();
    if (nome.length < 2) { setError('nome', 'Scrivi il tuo nome.'); ok = false; } else setError('nome', '');
    if (tel.replace(/[^\d]/g, '').length < 8) { setError('telefono', 'Inserisci un numero di telefono valido.'); ok = false; } else setError('telefono', '');

    if (!ok) {
      var firstErr = form.querySelector('.has-error, .field__error:not(:empty)');
      if (firstErr) firstErr.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      return;
    }

    var giorno = formatDay(parseDate(dateInput.value));
    var rows = [
      ['Servizio', service.value],
      ['Giorno', giorno],
      ['Orario', timeSelect.value],
      ['Nome', nome],
      ['Telefono', tel],
      ['Note', note || '—']
    ];
    summaryList.innerHTML = '';
    rows.forEach(function (r) {
      var div = document.createElement('div');
      var dt = document.createElement('dt');
      var dd = document.createElement('dd');
      dt.textContent = r[0];
      dd.textContent = r[1];
      div.appendChild(dt);
      div.appendChild(dd);
      summaryList.appendChild(div);
    });

    var msg = 'Ciao Beppe! Vorrei prenotare:\n' +
      'Servizio: ' + service.value + '\n' +
      'Giorno: ' + giorno + '\n' +
      'Orario: ' + timeSelect.value + '\n' +
      'Nome: ' + nome + '\n' +
      'Telefono: ' + tel + '\n' +
      'Note: ' + (note || '-');
    waLink.href = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

    form.hidden = true;
    summary.hidden = false;
    summary.closest('.booking').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  });

  document.getElementById('editBooking').addEventListener('click', function () {
    summary.hidden = true;
    form.hidden = false;
  });
})();
