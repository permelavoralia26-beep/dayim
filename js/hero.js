/* Lo Style E L'extro — la foto dell'hero prende vita con lo scorrimento.
   Movimento di macchina (zoom e carrellata), riflesso di luce sul metallo
   e ciuffi di capelli che cadono dalla lama. Tutto dipende solo
   dall'avanzamento: tornando su l'animazione va al contrario. */
(function () {
  'use strict';

  var canvas = document.getElementById('heroCanvas');
  var ctx = canvas.getContext('2d');
  var state = window.heroState || { p: 0 };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Coordinate di riferimento della foto (assets/hero.jpg in scala 873×884)
  var BW = 873, BH = 884;

  // Inquadrature chiave: [avanzamento, centro x, centro y, zoom]
  var shots = [
    [0.00, 560, 560, 2.0],   // dettaglio del tagliacapelli
    [0.22, 590, 560, 1.7],
    [0.42, 470, 470, 1.12],  // la mano che lo tiene
    [0.56, 345, 330, 1.55],  // vicino alla lama, sul lato della testa
    [0.80, 330, 280, 1.62],
    [1.00, 436, 442, 1.0]    // la foto intera
  ];

  // Sagoma approssimativa del tagliacapelli, per il riflesso di luce
  var body = [[252, 345], [395, 245], [412, 298], [500, 305], [565, 335], [612, 390], [625, 445], [600, 560], [690, 610], [760, 640], [830, 690], [860, 760], [850, 800], [780, 770], [700, 720], [600, 630], [470, 555], [380, 500], [320, 450], [290, 420]];

  // Bordo della lama da cui cadono i capelli
  var bladeA = [282, 350], bladeB = [394, 250];
  var CUT_A = 0.52, CUT_B = 0.86;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Ciuffi: ognuno nasce in un momento preciso della passata
  var hairs = [];
  (function () {
    var r = rand(11);
    for (var i = 0; i < 300; i++) {
      var tuft = r() < 0.25;
      hairs.push({
        born: lerp(CUT_A, CUT_B - 0.03, r()),
        along: r(),
        vx: -0.4 - r() * 1.6,
        vy: -0.6 + r() * 1.2,
        len: tuft ? 14 + r() * 12 : 7 + r() * 11,
        bend: (r() - 0.5) * 0.9,
        rot0: r() * Math.PI * 2,
        spin: (r() - 0.5) * 7,
        w: 0.9 + r() * 1.0,
        shade: 22 + r() * 40,
        tuft: tuft,
        n: tuft ? 3 + Math.floor(r() * 4) : 1,
        seed: Math.floor(r() * 1e6)
      });
    }
  })();

  function camAt(p) {
    for (var i = 1; i < shots.length; i++) {
      if (p <= shots[i][0]) {
        var a = shots[i - 1], b = shots[i];
        var t = smooth(a[0], b[0], p);
        return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
      }
    }
    var l = shots[shots.length - 1];
    return [l[1], l[2], l[3]];
  }

  var img = new Image();
  var W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  var time = 0, last = performance.now();

  function draw() {
    var now = performance.now();
    time += reduce ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    var p = state.p;

    // Copertura del riquadro + inquadratura
    var cam = camAt(p);
    var breathe = 1 + Math.sin(time * 0.5) * 0.006;
    var cover = Math.max(W / BW, H / BH);
    var k = cover * cam[2] * breathe;
    // non uscire dai bordi della foto
    var halfW = W / k / 2, halfH = H / k / 2;
    var cx = clamp(cam[0], halfW, BW - halfW);
    var cy = clamp(cam[1], halfH, BH - halfH);

    // durante il taglio, una leggerissima vibrazione
    var buzz = smooth(CUT_A - 0.02, CUT_A + 0.02, p) * (1 - smooth(CUT_B - 0.02, CUT_B + 0.02, p));
    if (buzz > 0 && !reduce) {
      cx += Math.sin(time * 70) * 0.35 * buzz;
      cy += Math.cos(time * 83) * 0.35 * buzz;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(k, k);
    ctx.translate(-cx, -cy);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, BW, BH);

    // Riflesso di luce che scorre sul metallo (segue lo scorrimento)
    var sweep = smooth(0.02, 0.4, p) * 1.2 + smooth(0.6, 0.98, p) * 1.2 - 0.3;
    if (sweep > -0.3 && sweep < 2.1) {
      var sw = sweep > 0.9 ? sweep - 1.2 : sweep;
      ctx.save();
      ctx.beginPath();
      for (var i = 0; i < body.length; i++) ctx[i ? 'lineTo' : 'moveTo'](body[i][0], body[i][1]);
      ctx.closePath();
      ctx.clip();
      var sx = lerp(260, 880, sw), sy = lerp(240, 840, sw);
      var g = ctx.createLinearGradient(sx - 90, sy + 60, sx + 90, sy - 60);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,250,238,0.24)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g;
      ctx.fillRect(240, 230, 640, 620);
      ctx.restore();
    }

    // Capelli che cadono dalla lama
    ctx.lineCap = 'round';
    for (var h = 0; h < hairs.length; h++) {
      var f = hairs[h];
      var t = (p - f.born) * 26; // secondi simulati
      if (t <= 0 || t > 2.4) continue;
      var x = lerp(bladeA[0], bladeB[0], f.along) + f.vx * 30 * t;
      var y = lerp(bladeA[1], bladeB[1], f.along) + f.vy * 30 * t + 0.5 * 260 * t * t;
      var a = (1 - smooth(1.6, 2.4, t)) * smooth(0, 0.08, t);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f.rot0 + f.spin * t);
      ctx.strokeStyle = 'rgba(' + Math.round(f.shade + 18) + ',' + Math.round(f.shade + 6) + ',' + Math.round(f.shade) + ',' + (0.85 * a).toFixed(3) + ')';
      var rr = rand(f.seed);
      for (var s = 0; s < f.n; s++) {
        var off = f.tuft ? (rr() - 0.5) * 3 : 0;
        var L = f.len * (f.tuft ? 0.7 + rr() * 0.5 : 1);
        ctx.lineWidth = f.w * (f.tuft ? 0.8 : 1);
        ctx.beginPath();
        ctx.moveTo(-L / 2, off);
        ctx.quadraticCurveTo(0, off + f.bend * L * 0.4 + (rr() - 0.5) * 2, L / 2, off + (rr() - 0.5) * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();

    // Vignettatura morbida
    var v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(20,18,16,0)');
    v.addColorStop(1, 'rgba(20,18,16,0.22)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }, { rootMargin: '100px' })
      .observe(document.getElementById('hero'));
  }

  function loop() {
    requestAnimationFrame(loop);
    if (visible) draw();
  }

  img.onload = function () {
    resize();
    window.addEventListener('resize', resize);
    canvas.classList.add('is-ready');
    loop();
  };
  img.src = 'assets/hero.jpg';
})();
