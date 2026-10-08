/* Lo Style E L'extro — hero con video realistico guidato dallo scorrimento.
   Il video (assets/hero.mp4, e facoltativo assets/hero-mobile.mp4 in verticale)
   avanza e torna indietro insieme allo scorrimento, come nei siti Apple.
   Finché il video non è presente, l'hero resta statico. */
(function () {
  'use strict';

  var video = document.getElementById('heroVideo');
  var state = window.heroState || { p: 0 };
  var portrait = window.innerWidth / window.innerHeight < 0.9;
  var sources = portrait ? ['assets/hero-mobile.mp4', 'assets/hero.mp4'] : ['assets/hero.mp4'];

  // Scarica il video intero: così si può scorrere avanti e indietro senza scatti (anche su iPhone)
  function load(i) {
    if (i >= sources.length || !window.fetch) return;
    fetch(sources[i]).then(function (r) {
      if (!r.ok) throw new Error('missing');
      return r.blob();
    }).then(function (blob) {
      video.src = URL.createObjectURL(blob);
      video.addEventListener('loadeddata', start, { once: true });
      video.load();
    }).catch(function () { load(i + 1); });
  }

  function start() {
    document.body.classList.remove('no-video');
    window.dispatchEvent(new Event('resize'));
    video.pause();
    video.classList.add('is-ready');
    var last = -1;
    var seeking = false;
    video.addEventListener('seeked', function () { seeking = false; });
    (function tick() {
      requestAnimationFrame(tick);
      var d = video.duration;
      if (!d || seeking) return;
      var t = Math.min(d - 0.04, Math.max(0, state.p * d));
      if (Math.abs(t - last) < 1 / 60) return;
      last = t;
      seeking = true;
      video.currentTime = t;
    })();
  }

  load(0);
})();
