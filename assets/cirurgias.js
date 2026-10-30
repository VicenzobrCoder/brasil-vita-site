/* ============================================================
   ENTENDA A CIRURGIA — desenhos (SVG) e animações (GSAP)
   ------------------------------------------------------------
   Os TEXTOS ficam em data/cirurgias.js. Aqui ficam só o desenho,
   o movimento e os controles.

   - Usa só o GSAP "core" já carregado pelo site, sem plugins:
     mudança de forma = caminhos com a mesma estrutura (o GSAP
     interpola os números do atributo d); traço sendo desenhado =
     stroke-dashoffset.
   - Cada cirurgia é uma linha do tempo pausada com as marcas
     s0..s6 (s0 = antes de tudo; sN = como o desenho fica na etapa N).
     Avançar ou voltar uma etapa toca o trecho entre as marcas
     (voltando, ao contrário). Pular várias etapas troca o desenho
     direto, com um esmaecer curto.
   - A linha do tempo só é montada quando a seção entra na tela.
   - Movimento reduzido (prefers-reduced-motion): troca direta de
     estado, sem nada se mexendo.
   - Teclado: setas esquerda/direita trocam a etapa quando o foco
     está dentro do painel; nas abas, trocam a cirurgia.
   - Escrito em JavaScript "antigo" (ES5) de propósito, como o resto
     do site, para funcionar em celulares mais velhos.
   ============================================================ */
(function () {
  'use strict';
  var d = document, DATA = window.BV_CIRURGIAS, box = d.querySelector('[data-surg]');
  if (!DATA || !box) return;

  var WA = 'https://wa.me/5511988757249?text=';
  var C = DATA.controles;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  function still() { return mq.matches; }

  /* ---------- utilidades de desenho ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function n(v) { return Math.round(v * 10) / 10; }
  function P(p) { return n(p[0]) + ',' + n(p[1]); }
  function path(pts, close) { var s = 'M' + P(pts[0]); for (var i = 1; i < pts.length; i++) s += ' L' + P(pts[i]); return close ? s + ' Z' : s; }
  // pontos de uma curva y = f(x), de 10 em 10 unidades (mesma quantidade
  // de pontos antes e depois, para o GSAP poder interpolar a forma)
  function samp(a, b, f) { var k = Math.max(2, Math.ceil(Math.abs(b - a) / 10)), o = []; for (var i = 0; i <= k; i++) { var x = a + (b - a) * i / k; o.push([x, f(x)]); } return o; }
  function curve(a, b, f) { return path(samp(a, b, f)); }
  function band(a, b, top, bot) { return path(samp(a, b, top).concat(samp(b, a, bot)), true); }
  function plus(f, k) { return function (x) { return f(x) + (typeof k === 'function' ? k(x) : k); }; }
  function E(tag, at, inner) {
    var s = '<' + tag;
    for (var k in at) if (at[k] != null) s += ' ' + k + '="' + at[k] + '"';
    return s + (inner == null ? '/>' : '>' + inner + '</' + tag + '>');
  }
  function T(x, y, txt, cls, anchor, k, st) { return E('text', { x: x, y: y, 'class': cls || 'lb', 'text-anchor': anchor || null, 'data-k': k || null, style: st || null }, esc(txt)); }
  function leader(x1, y1, x2, y2, k) {
    return E('g', { 'class': 'ld', 'data-k': k || null }, E('path', { d: 'M' + n(x1) + ',' + n(y1) + ' L' + n(x2) + ',' + n(y2) }) + E('circle', { cx: n(x2), cy: n(y2), r: 2.4 }));
  }
  function hide(extra) { return 'opacity:0' + (extra ? ';' + extra : ''); }
  function svg(id, c, inner) {
    return '<svg class="sv" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-labelledby="' + id + '-t ' + id + '-d">' +
      '<title id="' + id + '-t">' + esc(c.ilustracao.titulo) + '</title><desc id="' + id + '-d">' + esc(c.ilustracao.descricao) + '</desc>' + inner + '</svg>';
  }

  /* Frasco de colírio (bico) e gota. O bico e a gota ficam invisíveis até a etapa.
     sfx: sufixo dos nomes, para ter dois frascos no mesmo desenho;
     mod: variação de cor da gota (ex.: 'rb' = riboflavina, amarela). */
  function dropper(x, tipY, landY, rot, sfx, mod) {
    sfx = sfx || '';
    return E('g', { transform: 'translate(' + n(x) + ',' + n(tipY) + ')' },
        E('g', { 'data-k': 'noz' + sfx, style: hide() },
          E('path', { 'class': 'noz', d: 'M-13,-60 L13,-60 L13,-22 L4,-2 L-4,-2 L-13,-22 Z' }) +
          E('path', { 'class': 'noz-c', d: 'M-13,-44 L13,-44' })) +
        E('g', { 'data-k': 'drop' + sfx, style: hide() },
          E('path', { 'class': 'drop' + (mod ? ' drop--' + mod : ''), d: 'M0,-9 C3,-4 6.5,0 6.5,3.5 A6.5,6.5 0 0 1 -6.5,3.5 C-6.5,0 -3,-4 0,-9 Z' }))) +
      E('g', { transform: 'translate(' + n(x) + ',' + n(landY) + ') rotate(' + (rot || 0) + ')' },
        E('ellipse', { 'data-k': 'spl' + sfx, 'class': 'spl' + (mod ? ' spl--' + mod : ''), cx: 0, cy: 0, rx: 14, ry: 4, style: hide() }));
  }
  /* Aparelho de laser (fica acima da área visível até a etapa). */
  function device() {
    return E('g', { 'data-k': 'dev', style: hide() },
      E('rect', { 'class': 'dev', x: 136, y: -18, width: 128, height: 54, rx: 14 }) +
      E('rect', { 'class': 'dev-w', x: 148, y: 33, width: 104, height: 8, rx: 4 }) +
      E('circle', { 'class': 'dev-l', cx: 246, cy: 11, r: 4 }));
  }

  /* ---------- utilidades de animação ---------- */
  function q(root) { return function (k) { return root.querySelector('[data-k="' + k + '"]'); }; }
  // prepara um traço para ser "desenhado" (começa invisível)
  function prep(el) {
    var L = el.getTotalLength();
    el.style.strokeDasharray = n(L) + ' ' + n(L + 4);
    el.style.strokeDashoffset = n(L);
    el.style.visibility = 'visible';
    return el;
  }
  function drawTo(el, dur, ease) { return gsap.to(el, { strokeDashoffset: 0, duration: dur, ease: ease || 'power1.inOut' }); }
  // times: quantas gotas caem (padrão: uma)
  function dropTl($, fall, sfx, times) {
    sfx = sfx || '';
    var noz = $('noz' + sfx), drop = $('drop' + sfx), spl = $('spl' + sfx), t = gsap.timeline();
    t.set(noz, { y: -64 })
      .to(noz, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' });
    for (var i = 0; i < (times || 1); i++) {
      t.set(drop, { y: 9, scale: 0, opacity: 1 }, i ? '-=0.35' : '>')
        .to(drop, { scale: 1, duration: 0.4, ease: 'back.out(2)' })
        .to(drop, { y: fall, duration: 0.55, ease: 'power2.in' })
        .to(drop, { scaleX: 1.6, scaleY: 0.25, opacity: 0, duration: 0.2, ease: 'power1.out' })
        .set(spl, { scale: 0.3, opacity: 0.9 }, '<')
        .to(spl, { scale: 1.5, opacity: 0, duration: 0.7, ease: 'power2.out' }, '<');
    }
    t.to(noz, { y: -64, opacity: 0, duration: 0.5, ease: 'power2.in' }, '-=0.45');
    return t;
  }
  function origins($, keys) { for (var i = 0; i < keys.length; i++) { var el = $(keys[i]); if (el) gsap.set(el, { transformOrigin: '50% 50%' }); } }

  /* ============================================================
     CATARATA — olho visto de lado, em corte
     ============================================================ */
  function catarata(c, id) {
    var R = c.rotulos, rad = Math.PI / 180;
    // globo ocular
    var Ex = 226, Ey = 140, Er = 96;
    var Ax = Ex - Er * Math.cos(40 * rad), Ay = Ey - Er * Math.sin(40 * rad), By = 2 * Ey - Ay;
    // córnea: arco que passa pelas bordas (A, B) e pela ponta (apex)
    var apex = 104;
    var ccx = (Ax * Ax + (Ay - Ey) * (Ay - Ey) - apex * apex) / (2 * (Ax - apex)), Rc = ccx - apex, Ri = Rc - 6;
    var ix = ((Ri * Ri - Er * Er) / (Ex - ccx) + ccx + Ex) / 2, iy = Math.sqrt(Ri * Ri - (ix - ccx) * (ix - ccx));
    function wall(x) { return Ey - Math.sqrt(Er * Er - (x - Ex) * (x - Ex)); }
    // cristalino, fóvea, incisão (I) e ponta do instrumento (T)
    var Lx = 188, Ly = 140, Fx = Ex + 89, Fy = Ey;
    var Ix = 150, Iy = 84, Tx = 172, Ty = 132;
    var ux = Tx - Ix, uy = Ty - Iy, ul = Math.sqrt(ux * ux + uy * uy); ux /= ul; uy /= ul;
    var ang = Math.atan2(uy, ux) / rad;
    // raios de luz
    var ys = [128, 140, 152];
    function entry(y) { return ccx - Math.sqrt(Rc * Rc - (y - Ey) * (y - Ey)); }
    function ray(y, end) { return path([[-6, y], [entry(y), y], [Lx, Ly + (y - Ly) * 0.72], end]); }
    var spread = [[282, 104], [292, 129], [279, 183]];
    function arcPt(r, deg) { return [Ex + r * Math.cos(deg * rad), Ey + r * Math.sin(deg * rad)]; }

    var s = [];
    s.push('<defs>' +
      E('radialGradient', { id: id + '-cl', gradientUnits: 'userSpaceOnUse', cx: Lx, cy: Ly, r: 40, fx: Lx - 2, fy: Ly - 6 },
        E('stop', { offset: '0', 'class': 'cl-a' }) + E('stop', { offset: '.62', 'class': 'cl-b' }) + E('stop', { offset: '1', 'class': 'cl-c' })) +
      E('radialGradient', { id: id + '-cl2', gradientUnits: 'userSpaceOnUse', cx: 352, cy: 66, r: 24 },
        E('stop', { offset: '0', 'class': 'cl-a' }) + E('stop', { offset: '.62', 'class': 'cl-b' }) + E('stop', { offset: '1', 'class': 'cl-c' })) +
      E('clipPath', { id: id + '-rc' }, E('rect', { 'data-k': 'rclip', x: -10, y: 0, width: 0, height: 300 })) +
      E('clipPath', { id: id + '-ic' }, E('circle', { cx: 352, cy: 66, r: 37 })) +
      '</defs>');

    // nervo óptico (atrás do globo), globo e câmara anterior
    s.push(E('path', { 'class': 'nv-o', d: 'M316,156 L364,170' }) + E('path', { 'class': 'nv-i', d: 'M316,156 L364,170' }));
    s.push(E('circle', { 'class': 'fw', cx: Ex, cy: Ey, r: Er }) + E('circle', { 'class': 'fw', cx: n(ccx), cy: Ey, r: n(Ri) }));
    // retina
    var r1 = arcPt(89, -52), r2 = arcPt(89, 52);
    s.push(E('path', { 'class': 'ret', d: 'M' + P(r1) + ' A89,89 0 0,1 ' + P(r2) }));
    // fibras que seguram a cápsula
    s.push(E('path', { 'class': 'zon', d: 'M182,101.5 L176,' + n(wall(176) + 6) + ' M188,99.5 L184,' + n(wall(184) + 5) + ' M194,101.5 L192,' + n(wall(192) + 5) + ' M182,178.5 L176,' + n(2 * Ey - wall(176) - 6) + ' M188,180.5 L184,' + n(2 * Ey - wall(184) - 5) + ' M194,178.5 L192,' + n(2 * Ey - wall(192) - 5) }));
    // cápsula, cristalino opaco e os pedaços em que ele se divide
    s.push(E('ellipse', { 'class': 'cap', 'data-k': 'cap', cx: Lx, cy: Ly, rx: 17.5, ry: 40.5 }));
    s.push(E('ellipse', { 'class': 'lens', 'data-k': 'lens', cx: Lx, cy: Ly, rx: 15, ry: 38, fill: 'url(#' + id + '-cl)' }));
    var fr = { f1: 'M188,140 L188,102 A15,38 0 0,0 173,140 Z', f2: 'M188,140 L173,140 A15,38 0 0,0 188,178 Z', f3: 'M188,140 L203,140 A15,38 0 0,0 188,102 Z', f4: 'M188,140 L188,178 A15,38 0 0,0 203,140 Z' };
    var frags = '';
    for (var k in fr) frags += E('path', { 'class': 'frag', 'data-k': k, d: fr[k], fill: 'url(#' + id + '-cl)' });
    s.push(E('g', { 'data-k': 'frags', style: hide() }, frags));
    // lente intraocular (começa dobrada, na ponta do instrumento)
    s.push(E('g', { 'data-k': 'iol', style: hide() },
      E('path', { 'class': 'iol-h dr', 'data-k': 'h1', d: 'M188,113.5 Q195,106 189.5,100.5' }) +
      E('path', { 'class': 'iol-h dr', 'data-k': 'h2', d: 'M188,166.5 Q181,174 186.5,179.5' }) +
      E('ellipse', { 'class': 'iol', cx: Lx, cy: Ly, rx: 6.5, ry: 27 })));
    // íris
    s.push(E('rect', { 'class': 'iris', x: 164, y: n(wall(167) + 0.5), width: 6, height: n(108 - wall(167) - 0.5), rx: 3 }) +
      E('rect', { 'class': 'iris', x: 164, y: 172, width: 6, height: n(2 * Ey - wall(167) - 172 - 0.5), rx: 3 }));
    // córnea (meia-lua) e contorno do globo
    s.push(E('path', { 'class': 'cor', d: 'M' + P([Ax, Ay]) + ' A' + n(Rc) + ',' + n(Rc) + ' 0 0,0 ' + P([Ax, By]) + ' L' + P([ix, Ey + iy]) + ' A' + n(Ri) + ',' + n(Ri) + ' 0 0,1 ' + P([ix, Ey - iy]) + ' Z' }));
    s.push(E('path', { 'class': 'ol', d: 'M' + P([Ax, Ay]) + ' A' + Er + ',' + Er + ' 0 1,1 ' + P([Ax, By]) }));
    // abertura da cápsula e incisão (traços que aparecem sendo desenhados)
    s.push(E('path', { 'class': 'act dr', 'data-k': 'rhx', d: 'M174.5,123 A4,17 0 0,1 174.5,157 A4,17 0 0,1 174.5,123' }));
    s.push(E('path', { 'class': 'act dr', 'data-k': 'inc', d: 'M' + P([Ix - 9 * ux, Iy - 9 * uy]) + ' L' + P([Ix + 9 * ux, Iy + 9 * uy]) }));
    // luz: raios principais, raios espalhados e mancha na retina
    var rays = '';
    for (var i = 0; i < 3; i++) rays += E('path', { 'class': 'ray', 'data-k': 'r' + i, d: ray(ys[i], spread[i]) });
    var b1 = arcPt(89, -24), b2 = arcPt(89, 24);
    rays += E('g', { 'data-k': 'sc', 'class': 'sc' },
      E('path', { 'class': 'ray ray--sc', d: 'M198,133 L258,98' }) + E('path', { 'class': 'ray ray--sc', d: 'M199,138 L268,118' }) +
      E('path', { 'class': 'ray ray--sc', d: 'M199,143 L268,160' }) + E('path', { 'class': 'ray ray--sc', d: 'M198,148 L256,190' }));
    rays += E('path', { 'class': 'blur', 'data-k': 'blur', d: 'M' + P(b1) + ' A89,89 0 0,1 ' + P(b2), style: hide() });
    s.push(E('g', { 'data-k': 'rays', 'clip-path': 'url(#' + id + '-rc)' }, rays));
    s.push(E('circle', { 'class': 'fr', 'data-k': 'fring', cx: Fx, cy: Fy, r: 5, style: hide() }) + E('circle', { 'class': 'fd', 'data-k': 'fdot', cx: Fx, cy: Fy, r: 4.5, style: hide() }));
    // instrumento (ponteira): desliza ao longo do próprio eixo
    s.push(E('g', { transform: 'translate(' + Tx + ',' + Ty + ') rotate(' + n(ang) + ')' },
      E('g', { 'data-k': 'probe', style: hide() },
        E('rect', { 'class': 'pr-handle', x: -320, y: -11, width: 170, height: 22, rx: 8 }) +
        E('rect', { 'class': 'pr-sleeve', x: -156, y: -6, width: 74, height: 12, rx: 5 }) +
        E('rect', { 'class': 'pr-shaft', x: -86, y: -3.2, width: 86, height: 6.4, rx: 3.2 }) +
        E('rect', { 'class': 'pr-tip', x: -9, y: -3.2, width: 9, height: 6.4, rx: 3.2 }))));
    // colírio
    s.push(dropper(122.6, 22, 95.1, -45));
    // detalhe "vista de frente" (etapas 3 e 5)
    s.push(E('g', { 'data-k': 'inset', style: hide() },
      T(394, 18, R.frente, 'lb lb--m', 'end') +
      E('circle', { 'class': 'in-bg', cx: 352, cy: 66, r: 38 }) +
      E('g', { 'clip-path': 'url(#' + id + '-ic)' },
        E('g', { 'data-k': 'inA' }, E('circle', { cx: 352, cy: 66, r: 24, fill: 'url(#' + id + '-cl2)' })) +
        E('g', { 'data-k': 'inB', style: hide() },
          E('circle', { 'class': 'in-clear', cx: 352, cy: 66, r: 24 }) +
          E('path', { 'class': 'iol-h dr', 'data-k': 'ih1', d: 'M356.5,58.2 C364,50 375,57 371,71' }) +
          E('path', { 'class': 'iol-h dr', 'data-k': 'ih2', d: 'M347.5,73.8 C340,82 329,75 333,61' }) +
          E('circle', { 'class': 'iol', cx: 352, cy: 66, r: 9 })) +
        E('circle', { 'class': 'in-iris', cx: 352, cy: 66, r: 30 })) +
      E('path', { 'class': 'act dr', 'data-k': 'inR', d: 'M352,53 A13,13 0 0,1 352,79 A13,13 0 0,1 352,53' })));
    // nomes das partes
    s.push(T(16, 58, R.cornea) + leader(56, 66, 108, 104));
    s.push(T(96, 282, R.iris) + leader(124, 264, 166, 206));
    s.push(T(158, 282, R.cristalino, 'lb', null, 'lbA') + T(158, 282, R.capsula, 'lb', null, 'lbB', hide()) + T(158, 282, R.lente, 'lb', null, 'lbC', hide()) + leader(186, 264, 189, 182));
    s.push(T(394, 282, R.retina, 'lb', 'end') + leader(352, 264, 296, 200));

    return {
      markup: svg(id, c, s.join('')),
      build: function (root) {
        var $ = q(root);
        prep($('rhx')); prep($('inc')); prep($('h1')); prep($('h2')); prep($('ih1')); prep($('ih2')); prep($('inR'));
        origins($, ['drop', 'spl', 'f1', 'f2', 'f3', 'f4', 'fring', 'inset']);
        gsap.set($('iol'), { svgOrigin: Lx + ' ' + Ly, x: Tx - Lx, y: Ty - Ly, rotation: ang - 90, scaleX: 0.45, scaleY: 0.32 });
        gsap.set($('probe'), { x: -64 });
        gsap.set($('inset'), { scale: 0.85 });

        var focus = [];
        for (var i = 0; i < 3; i++) focus.push(ray(ys[i], [Fx, Fy]));
        // centro de cada pedaço do cristalino, para mandá-lo à ponta do instrumento
        var fc = { f1: [182.5, 124], f2: [182.5, 156], f3: [193.5, 124], f4: [193.5, 156] };

        var tl = gsap.timeline({ paused: true });
        tl.addLabel('s0');
        // 1. a luz entra e se espalha antes da retina
        tl.to($('rclip'), { attr: { width: 420 }, duration: 1.9, ease: 'power1.inOut' })
          .to($('blur'), { opacity: 1, duration: 0.6 }, '-=0.6')
          .addLabel('s1');
        // 2. colírio anestésico e microincisão
        tl.to($('rays'), { opacity: 0, duration: 0.5 })
          .add(dropTl($, 95.1 - 22 - 10), '<')
          .add(drawTo($('inc'), 0.8), '-=0.2')
          .addLabel('s2');
        // 3. abertura circular da cápsula (de lado e de frente)
        tl.to($('inset'), { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' })
          .add(drawTo($('rhx'), 1.4), '-=0.1')
          .add(drawTo($('inR'), 1.4), '<')
          .addLabel('s3');
        // 4. ultrassom: o cristalino é fragmentado e aspirado
        tl.to($('inset'), { opacity: 0, scale: 0.85, duration: 0.4 })
          .to($('lbA'), { opacity: 0, duration: 0.3 }, '<')
          .to($('lbB'), { opacity: 1, duration: 0.3 }, '>')
          .to($('probe'), { opacity: 1, duration: 0.3 }, '<')
          .to($('probe'), { x: 0, duration: 0.9, ease: 'power2.out' }, '<')
          .to($('frags'), { opacity: 1, duration: 0.25 })
          .to($('lens'), { opacity: 0, duration: 0.25 }, '<')
          .to($('f1'), { x: -2, y: -2, duration: 0.35 }, '+=0.1')
          .to($('f2'), { x: -2, y: 2, duration: 0.35 }, '<')
          .to($('f3'), { x: 2, y: -2, duration: 0.35 }, '<')
          .to($('f4'), { x: 2, y: 2, duration: 0.35 }, '<');
        ['f1', 'f2', 'f3', 'f4'].forEach(function (k, j) {
          tl.to($(k), { x: Tx - fc[k][0], y: Ty - fc[k][1], scale: 0.15, opacity: 0, duration: 0.7, ease: 'power2.in' }, j ? '-=0.4' : '+=0.15');
        });
        tl.addLabel('s4');
        // 5. a lente dobrável entra e se abre dentro da cápsula
        tl.to($('lbB'), { opacity: 0, duration: 0.3 })
          .to($('lbC'), { opacity: 1, duration: 0.3 }, '>')
          .to($('iol'), { opacity: 1, duration: 0.25 }, '<')
          .to($('iol'), { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, duration: 1.5, ease: 'power2.inOut' })
          .add(drawTo($('h1'), 0.7), '-=0.2')
          .add(drawTo($('h2'), 0.7), '<')
          .set($('inA'), { opacity: 0 }, '<')
          .set($('inR'), { opacity: 0 }, '<')
          .set($('inB'), { opacity: 1 }, '<')
          .to($('inset'), { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, '<')
          .add(drawTo($('ih1'), 0.8), '-=0.1')
          .add(drawTo($('ih2'), 0.8), '<')
          .addLabel('s5');
        // 6. o instrumento sai, a incisão some e a luz volta a focar na retina
        tl.to($('inset'), { opacity: 0, scale: 0.85, duration: 0.4 })
          .to($('probe'), { x: -130, duration: 1, ease: 'power2.in' }, '<')
          .to($('probe'), { opacity: 0, duration: 0.3 }, '-=0.3')
          .to([$('inc'), $('rhx')], { opacity: 0, duration: 0.6 }, '<')
          .set($('sc'), { opacity: 0 })
          .set($('blur'), { opacity: 0 })
          .set($('r0'), { attr: { d: focus[0] } })
          .set($('r1'), { attr: { d: focus[1] } })
          .set($('r2'), { attr: { d: focus[2] } })
          .set($('rclip'), { attr: { width: 0 } })
          .set($('rays'), { opacity: 1 })
          .to($('rclip'), { attr: { width: 420 }, duration: 1.7, ease: 'power1.inOut' })
          .to($('fdot'), { opacity: 1, duration: 0.3 }, '-=0.35')
          .set($('fring'), { opacity: 0.8, scale: 1 })
          .to($('fring'), { opacity: 0, scale: 3.4, duration: 0.9, ease: 'power2.out' })
          .addLabel('s6');
        return tl;
      }
    };
  }

  /* ============================================================
     CÓRNEA EM CORTE — base comum ao LASIK e ao PRK
     O desenho de base é exatamente o mesmo nas duas abas; só muda
     o que acontece com ele: lamela (LASIK) x epitélio retirado (PRK).
     ============================================================ */
  var K = 681.7, AP = 108;                          // superfície da córnea: arco de raio grande
  function yA(x) { return AP + K - Math.sqrt(K * K - (x - 200) * (x - 200)); }
  var EP = 12, FL = 30, TH = 70;                    // epitélio, profundidade da lamela, espessura
  var Z0 = 130, Z1 = 270;                           // largura da lamela / do epitélio retirado
  function dep(x) { var t = (x - 200) / 60; return Math.abs(t) >= 1 ? 0 : 5.5 * (1 - t * t) * (1 - t * t); } // tecido retirado pelo laser
  var yE = plus(yA, EP), yF = plus(yA, FL), yP = plus(yA, TH);
  var yAn = plus(yA, dep), yEn = plus(yE, dep), yFn = plus(yF, dep);

  /* Olho inteiro pequeno, embaixo: mostra onde a luz forma o foco. */
  var MI = { x: 318, y: 262, r: 30 }, MF = 326, MR = 345, mys = [252, 262, 272];
  function miniRay(y, focused) {
    if (focused) return path([[170, y], [283, y], [MR, MI.y], [MR, MI.y]]);
    return path([[170, y], [283, y], [MF, MI.y], [MR, MI.y + (MI.y - y) * (MR - MF) / (MF - 283)]]);
  }
  function miniCornea(apexX) { return 'M295,242.7 Q' + n(2 * apexX - 295) + ',262 295,281.3'; }
  function mini(R, id) {
    var s = E('path', { 'class': 'div', d: 'M16,224 L384,224' });
    s += T(16, 248, R.olho) +
      E('g', { 'data-k': 'mA' }, T(16, 270, R.antes1, 'lb lb--m') + T(16, 292, R.antes2, 'lb lb--m')) +
      E('g', { 'data-k': 'mB', style: hide() }, T(16, 270, R.depois1, 'lb lb--m') + T(16, 292, R.depois2, 'lb lb--m'));
    s += E('circle', { 'class': 'fw', cx: MI.x, cy: MI.y, r: MI.r });
    s += E('path', { 'class': 'ret ret--s', d: 'M335.4,241.3 A27,27 0 0,1 335.4,282.7' });
    s += E('ellipse', { 'class': 'mlens', cx: 300.5, cy: MI.y, rx: 4, ry: 11 });
    s += E('path', { 'class': 'ol ol--s', d: 'M295,242.7 A30,30 0 1,1 295,281.3' });
    s += E('path', { 'class': 'ol ol--s', 'data-k': 'mc', d: miniCornea(281) });
    var r = '';
    for (var i = 0; i < 3; i++) r += E('path', { 'class': 'ray ray--s', 'data-k': 'mr' + i, d: miniRay(mys[i]) });
    r += E('path', { 'class': 'blur blur--s', 'data-k': 'mblur', d: 'M344,254.6 A27,27 0 0,1 344,269.4', style: hide() });
    s += E('g', { 'clip-path': 'url(#' + id + '-mc)' }, r);
    s += E('circle', { 'class': 'fr', 'data-k': 'mring', cx: MR, cy: MI.y, r: 4, style: hide() });
    s += E('circle', { 'class': 'fd', 'data-k': 'mdot', cx: MF, cy: MI.y, r: 3.6, style: hide() });
    return s;
  }
  function miniIntro($, tl) {
    tl.to($('mclip'), { attr: { width: 200 }, duration: 1.7, ease: 'power1.inOut' })
      .to([$('mblur'), $('mdot')], { opacity: 1, duration: 0.5 }, '-=0.5');
  }
  function miniFocus($) {
    var t = gsap.timeline();
    for (var i = 0; i < 3; i++) t.to($('mr' + i), { attr: { d: miniRay(mys[i], true) }, duration: 1.3, ease: 'power2.inOut' }, 0);
    t.to($('mdot'), { attr: { cx: MR }, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to($('mc'), { attr: { d: miniCornea(283) }, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to($('mblur'), { opacity: 0, duration: 0.6 }, 0)
      .to($('mA'), { opacity: 0, duration: 0.4 }, 0.2)
      .to($('mB'), { opacity: 1, duration: 0.4 }, 0.6)
      .set($('mring'), { opacity: 0.8, scale: 1 }, 1.3)
      .to($('mring'), { opacity: 0, scale: 3.2, duration: 0.9, ease: 'power2.out' }, 1.3);
    return t;
  }
  /* Varredura do excimer laser: o feixe vai e volta enquanto a curvatura muda. */
  function excimer($, tl, morphs) {
    tl.to($('dev'), { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' })
      .to($('ovl'), { opacity: 1, duration: 0.4 })
      .to($('beam'), { opacity: 1, duration: 0.25 })
      .addLabel('abl')
      .to($('beamX'), { x: -58, duration: 0.5, ease: 'sine.inOut' }, 'abl')
      .to($('beamX'), { x: 58, duration: 0.9, ease: 'sine.inOut' })
      .to($('beamX'), { x: -40, duration: 0.75, ease: 'sine.inOut' })
      .to($('beamX'), { x: 30, duration: 0.6, ease: 'sine.inOut' })
      .to($('beamX'), { x: 0, duration: 0.35, ease: 'sine.inOut' });
    for (var i = 0; i < morphs.length; i++) tl.to(morphs[i][0], { attr: { d: morphs[i][1] }, duration: 3.1, ease: 'power1.inOut' }, 'abl');
    tl.to($('beam'), { opacity: 0, duration: 0.25 })
      .to($('ovl'), { opacity: 0, duration: 0.2 }, '<')
      .to($('dev'), { y: -72, opacity: 0, duration: 0.6, ease: 'power2.in' });
  }

  function cornea(c, id, mode) {
    var R = c.rotulos, lasik = mode === 'lasik';
    var s = [];
    s.push('<defs>' +
      E('clipPath', { id: id + '-mc' }, E('rect', { 'data-k': 'mclip', x: 160, y: 226, width: 0, height: 74 })) +
      (lasik ? '' : E('clipPath', { id: id + '-ec' }, E('rect', { 'data-k': 'ecL', x: Z0 - 1, y: 80, width: 0, height: 80 }) + E('rect', { 'data-k': 'ecR', x: Z1 + 1, y: 80, width: 0, height: 80 }))) +
      '</defs>');
    // feixe do excimer: fica por baixo do tecido, então "termina" na superfície
    s.push(E('g', { 'data-k': 'beamX' }, E('g', { 'data-k': 'beam', style: hide() },
      E('rect', { 'class': 'bm', x: 191, y: 41, width: 18, height: 119 }) + E('rect', { 'class': 'bm-c', x: 199, y: 41, width: 2, height: 119 }))));
    // ---- base comum: estroma e epitélio em pedaços que se encaixam ----
    s.push(E('path', { 'class': 'st', d: band(-10, Z0 + 0.6, yE, yP) }) + E('path', { 'class': 'st', d: band(Z1 - 0.6, 410, yE, yP) }) +
      E('path', { 'class': 'st', 'data-k': 'stB', d: band(Z0, Z1, yF, yP) }));
    if (lasik) s.push(E('path', { 'class': 'bed', 'data-k': 'bedL', d: curve(Z0, Z1, yF), style: hide() }) +
      E('path', { 'class': 'ovl', 'data-k': 'ovl', d: band(140, 260, yF, yFn), style: hide() }));
    s.push(E('path', { 'class': 'ep', d: band(-10, Z0 + 0.6, yA, yE) }) + E('path', { 'class': 'ep', d: band(Z1 - 0.6, 410, yA, yE) }));
    s.push(E('path', { 'class': 'post', d: curve(-10, 410, yP) }) +
      E('path', { 'class': 'ant', d: curve(-10, Z0, yA) }) + E('path', { 'class': 'ant', d: curve(Z1, 410, yA) }) +
      E('path', { 'class': 'int', d: curve(-10, Z0, yE) }) + E('path', { 'class': 'int', d: curve(Z1, 410, yE) }));
    // parte central (no LASIK, é a lamela que gira na dobradiça)
    s.push(E('g', { 'data-k': 'ctr' },
      E('path', { 'class': 'st', 'data-k': 'stF', d: band(Z0, Z1, yE, plus(yF, 0.6)) }) +
      E('path', { 'class': 'ep', 'data-k': 'epC', d: band(Z0, Z1, yA, yE) }) +
      E('path', { 'class': 'int', 'data-k': 'intC', d: curve(Z0, Z1, yE) }) +
      E('path', { 'class': 'ant', 'data-k': 'antC', d: curve(Z0, Z1, yA) }) +
      (lasik ? E('path', { 'class': 'edge', 'data-k': 'edge', d: path(samp(Z0, Z1, yA).concat(samp(Z1, Z0, yF))), style: hide() }) : '')));
    if (!lasik) {
      s.push(E('path', { 'class': 'ovl', 'data-k': 'ovl', d: band(140, 260, yE, yEn), style: hide() }));
      // epitélio novo, que cresce das bordas para o centro
      s.push(E('g', { 'clip-path': 'url(#' + id + '-ec)' },
        E('path', { 'class': 'ep', d: band(Z0 - 0.6, Z1 + 0.6, yAn, yEn) }) + E('path', { 'class': 'ant', d: curve(Z0, Z1, yAn) })));
      // lente de contato terapêutica
      s.push(E('g', { 'data-k': 'lensC', style: hide() }, E('path', { 'class': 'cl-o', d: curve(Z0 - 52, Z1 + 52, plus(yA, -3.6)) }) + E('path', { 'class': 'cl-i', d: curve(Z0 - 52, Z1 + 52, plus(yA, -3.6)) })));
    } else {
      // linha de corte do laser de femtossegundo + ponto e feixe que a acompanham
      s.push(E('path', { 'class': 'act act--cut dr', 'data-k': 'cut', d: path([[Z1, yA(Z1)]].concat(samp(Z1, Z0, yF))) }));
      s.push(E('line', { 'class': 'fb', 'data-k': 'fbeam', x1: Z1, y1: 41, x2: Z1, y2: n(yA(Z1)), style: hide() }) +
        E('circle', { 'class': 'fd', 'data-k': 'fdot', cx: Z1, cy: n(yA(Z1)), r: 4.5, style: hide() }));
    }
    s.push(device());
    s.push(dropper(200, 40, AP, 0));
    // nomes
    s.push(T(392, 30, R.corte, 'lb lb--m', 'end') + T(392, 52, R.corte2, 'lb lb--m', 'end'));
    s.push(T(392, 100, R.epitelio, 'lb', 'end') + leader(352, 106, 352, yA(352) + 6));
    s.push(T(392, 174, R.estroma, 'lb', 'end'));
    s.push(mini(R, id));

    return {
      markup: svg(id, c, s.join('')),
      build: function (root) {
        var $ = q(root);
        origins($, ['drop', 'spl', 'mring', 'fring']);
        gsap.set($('dev'), { y: -72 });
        var tl = gsap.timeline({ paused: true });
        tl.addLabel('s0');
        // 1. por que corrigir: no olho inteiro, o foco cai antes da retina
        miniIntro($, tl);
        tl.addLabel('s1');
        // 2. colírio anestésico
        tl.add(dropTl($, AP - 40 - 10)).addLabel('s2');

        if (lasik) {
          // 3. o laser de femtossegundo corta a lamela, deixando a dobradiça
          var cut = prep($('cut')), L = cut.getTotalLength(), pr = { p: 0 }, dot = $('fdot'), fb = $('fbeam');
          var follow = function () {
            var pt = cut.getPointAtLength(pr.p * L);
            dot.setAttribute('cx', n(pt.x)); dot.setAttribute('cy', n(pt.y));
            fb.setAttribute('x1', n(pt.x)); fb.setAttribute('x2', n(pt.x)); fb.setAttribute('y2', n(pt.y));
          };
          tl.to($('dev'), { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' })
            .to([dot, fb], { opacity: 1, duration: 0.2 })
            .addLabel('cut')
            .to(cut, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut' }, 'cut')
            .to(pr, { p: 1, duration: 2.6, ease: 'power1.inOut', onUpdate: follow }, 'cut')
            .to([dot, fb], { opacity: 0, duration: 0.3 })
            .to($('edge'), { opacity: 1, duration: 0.4 }, '<')
            .to($('dev'), { y: -72, opacity: 0, duration: 0.6, ease: 'power2.in' }, '-=0.1')
            .addLabel('s3');
          // 4. a lamela é levantada como a página de um livro
          gsap.set($('ctr'), { svgOrigin: Z0 + ' ' + n(yF(Z0)) });
          tl.to(cut, { opacity: 0, duration: 0.4 })
            .to($('bedL'), { opacity: 1, duration: 0.3 }, '<')
            .to($('ctr'), { rotation: -135, duration: 1.9, ease: 'power2.inOut' })
            .addLabel('s4');
          // 5. o excimer laser remodela a camada interna
          excimer($, tl, [[$('stB'), band(Z0, Z1, yFn, yP)], [$('bedL'), curve(Z0, Z1, yFn)], [$('ovl'), band(140, 260, yFn, yFn)]]);
          tl.addLabel('s5');
          // 6. a lamela volta ao lugar, já com a curvatura nova
          tl.addLabel('back')
            .to($('ctr'), { rotation: 0, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('stF'), { attr: { d: band(Z0, Z1, yEn, plus(yFn, 0.6)) }, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('epC'), { attr: { d: band(Z0, Z1, yAn, yEn) }, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('intC'), { attr: { d: curve(Z0, Z1, yEn) }, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('antC'), { attr: { d: curve(Z0, Z1, yAn) }, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('edge'), { attr: { d: path(samp(Z0, Z1, yAn).concat(samp(Z1, Z0, yFn))) }, duration: 1.9, ease: 'power2.inOut' }, 'back')
            .to($('bedL'), { opacity: 0, duration: 0.3 }, 'back+=1.6')
            .to($('edge'), { opacity: 0, duration: 0.9 })
            .add(miniFocus($), '-=0.3')
            .addLabel('s6');
        } else {
          // 3. o epitélio do centro é retirado
          tl.to([$('epC'), $('antC')], { opacity: 0, y: -6, duration: 1.4, ease: 'power1.inOut' })
            .to($('intC'), { strokeWidth: 2.2, duration: 1.4, ease: 'power1.inOut' }, '<')
            .addLabel('s3');
          // 4. o excimer laser remodela direto na superfície
          excimer($, tl, [[$('stF'), band(Z0, Z1, yEn, plus(yF, 0.6))], [$('intC'), curve(Z0, Z1, yEn)], [$('ovl'), band(140, 260, yEn, yEn)]]);
          tl.addLabel('s4');
          // 5. lente de contato de proteção
          gsap.set($('lensC'), { y: -80 });
          tl.to($('lensC'), { opacity: 1, duration: 0.3 })
            .to($('lensC'), { y: 0, duration: 1.4, ease: 'power2.out' }, '<')
            .addLabel('s5');
          // 6. o epitélio cresce das bordas para o centro
          tl.addLabel('grow')
            .to($('ecL'), { attr: { width: 200 - Z0 + 1.5 }, duration: 2.4, ease: 'power1.inOut' }, 'grow')
            .to($('ecR'), { attr: { x: 198.5, width: Z1 - 200 + 2.5 }, duration: 2.4, ease: 'power1.inOut' }, 'grow')
            .to($('intC'), { strokeWidth: 1, duration: 2.4, ease: 'power1.inOut' }, 'grow')
            .add(miniFocus($), '-=0.4')
            .addLabel('s6');
        }
        return tl;
      }
    };
  }

  /* ============================================================
     CROSSLINKING — a mesma córnea em corte, agora com ceratocone
     Na etapa 1 a córnea afina no centro e se deforma em cone (no
     corte e no olho pequeno de baixo). O estroma é desenhado com
     fibras (linhas onduladas); a luz ultravioleta, junto com a
     riboflavina, cria "novas ligações" entre elas (tracinhos).
     ============================================================ */
  function bump(x) { var t = (x - 200) / 62; return Math.exp(-t * t); }
  var yAk = plus(yA, function (x) { return -12 * bump(x); }), yEk = plus(yAk, EP);
  var yPk = plus(yA, function (x) { return TH - 30 * bump(x); });
  var FIB = [0.2, 0.4, 0.6, 0.8];                   // altura de cada fibra dentro do estroma
  function fiber(j, top, bot, amp) {
    return function (x) { return top(x) + (bot(x) - top(x)) * FIB[j] + amp * Math.sin(x / 7 + j * 1.9); };
  }
  function fine(a, b, f) { var o = []; for (var x = a; x <= b + 0.01; x += 5) o.push([x, f(x)]); return path(o); }
  // córnea do olho pequeno: a = quanto se projeta, p = quão pontuda
  function miniCone(a, p) {
    var o = [];
    for (var i = 0; i <= 20; i++) { var t = i / 20, u = 2 * t - 1; o.push([295 - a * Math.pow(1 - u * u, p), 242.7 + 38.6 * t]); }
    return path(o);
  }

  function crosslinking(c, id) {
    var R = c.rotulos, s = [], morph = [];
    // elemento que muda de forma na etapa 1: guarda o desenho normal e o do ceratocone
    function M(cls, k, dn, dk) { morph.push([k, dk]); return E('path', { 'class': cls, 'data-k': k, d: dn }); }
    var AMP0 = 1.6, AMP1 = 0.6;                     // ondulação das fibras antes e depois das ligações
    var fibK = [], fibF = [];
    for (var j = 0; j < 4; j++) { fibK.push(fiber(j, yEk, yPk, AMP0)); fibF.push(fiber(j, yEk, yPk, AMP1)); }
    // novas ligações: entre a 1ª e a 2ª fibra e entre a 2ª e a 3ª, só na área tratada
    var bonds = [];
    for (var b = 0; b < 2; b++) {
      for (var bx = 146 + b * 6; bx <= 254; bx += 12) bonds.push([bx, fibF[b](bx) + 1.4, fibF[b + 1](bx) - 1.4]);
    }
    var tip = bonds[0];                             // onde a seta "Novas ligações" aponta
    var surfC = yAk(200), stC = yEk(200);           // ponta do cone; superfície do estroma no centro

    s.push('<defs>' +
      E('clipPath', { id: id + '-ec' }, E('rect', { 'data-k': 'ecL', x: Z0 - 1, y: 70, width: 0, height: 90 }) + E('rect', { 'data-k': 'ecR', x: Z1 + 1, y: 70, width: 0, height: 90 })) +
      E('clipPath', { id: id + '-rc' }, E('rect', { 'data-k': 'rbClip', x: -10, y: 100, width: 420, height: 0 })) +
      E('linearGradient', { id: id + '-rg', gradientUnits: 'userSpaceOnUse', x1: 60, y1: 0, x2: 340, y2: 0 },
        E('stop', { offset: '0', 'class': 'rb-a' }) + E('stop', { offset: '.32', 'class': 'rb-b' }) +
        E('stop', { offset: '.68', 'class': 'rb-b' }) + E('stop', { offset: '1', 'class': 'rb-a' })) +
      '</defs>');
    // estroma
    s.push(M('st', 'stA', band(-10, 410, yE, yP), band(-10, 410, yEk, yPk)));
    // riboflavina: entra pelo centro e desce pelo estroma
    s.push(E('g', { 'data-k': 'rb', 'clip-path': 'url(#' + id + '-rc)' },
      E('path', { d: band(-10, 410, yEk, yPk), fill: 'url(#' + id + '-rg)' })));
    // fibras do estroma
    for (j = 0; j < 4; j++) s.push(M('fib', 'fb' + j, fine(-10, 410, fiber(j, yE, yP, AMP0)), fine(-10, 410, fibK[j])));
    // novas ligações (traços desenhados na etapa 5)
    var bl = '';
    for (b = 0; b < bonds.length; b++) bl += E('path', { 'class': 'bond dr', 'data-x': bonds[b][0], d: 'M' + bonds[b][0] + ',' + n(bonds[b][1]) + ' L' + bonds[b][0] + ',' + n(bonds[b][2]) });
    s.push(E('g', null, bl));
    // epitélio (o pedaço do centro é retirado na etapa 3)
    s.push(M('ep', 'epL', band(-10, Z0 + 0.6, yA, yE), band(-10, Z0 + 0.6, yAk, yEk)) + M('ep', 'epR', band(Z1 - 0.6, 410, yA, yE), band(Z1 - 0.6, 410, yAk, yEk)));
    s.push(M('post', 'post', curve(-10, 410, yP), curve(-10, 410, yPk)) +
      M('ant', 'antL', curve(-10, Z0, yA), curve(-10, Z0, yAk)) + M('ant', 'antR', curve(Z1, 410, yA), curve(Z1, 410, yAk)) +
      M('int', 'intL', curve(-10, Z0, yE), curve(-10, Z0, yEk)) + M('int', 'intR', curve(Z1, 410, yE), curve(Z1, 410, yEk)));
    s.push(M('ep', 'epC', band(Z0, Z1, yA, yE), band(Z0, Z1, yAk, yEk)) +
      M('int', 'intC', curve(Z0, Z1, yE), curve(Z0, Z1, yEk)) +
      M('ant', 'antC', curve(Z0, Z1, yA), curve(Z0, Z1, yAk)));
    // epitélio novo, que cresce das bordas para o centro
    s.push(E('g', { 'clip-path': 'url(#' + id + '-ec)' },
      E('path', { 'class': 'ep', d: band(Z0 - 0.6, Z1 + 0.6, yAk, yEk) }) + E('path', { 'class': 'ant', d: curve(Z0, Z1, yAk) })));
    // lente de contato de proteção
    s.push(E('g', { 'data-k': 'lensC', style: hide() }, E('path', { 'class': 'cl-o', d: curve(Z0 - 52, Z1 + 52, plus(yAk, -3.6)) }) + E('path', { 'class': 'cl-i', d: curve(Z0 - 52, Z1 + 52, plus(yAk, -3.6)) })));
    // luz ultravioleta: do aparelho até a superfície do estroma
    var uvl = '';
    for (var ux = 166; ux <= 234; ux += 17) uvl += 'M' + ux + ',41 L' + ux + ',' + n(yEk(ux) - 2) + ' ';
    s.push(E('g', { 'data-k': 'uv', style: hide() },
      E('path', { 'class': 'uv', d: path([[150, 41], [250, 41]].concat(samp(262, 138, yEk)), true) }) +
      E('path', { 'class': 'uv-l', 'data-k': 'uvl', d: uvl }) +
      E('path', { 'class': 'uv-s', d: curve(140, 260, yEk) })));
    s.push(device());
    s.push(dropper(200, 40, surfC, 0));
    s.push(dropper(200, 40, stC, 0, '2', 'rb'));
    // nomes
    s.push(T(392, 30, R.corte, 'lb lb--m', 'end') + T(392, 52, R.corte2, 'lb lb--m', 'end'));
    s.push(T(392, 100, R.epitelio, 'lb', 'end') + leader(352, 106, 352, yA(352) + 6));
    s.push(T(392, 174, R.estroma, 'lb', 'end'));
    s.push(E('g', { 'data-k': 'lbR', style: hide() }, T(16, 52, R.riboflavina) + leader(64, 60, 118, n(yEk(118) + 18))));
    s.push(E('g', { 'data-k': 'lbL', style: hide() }, T(16, 30, R.ligacoes1) + T(16, 52, R.ligacoes2) + leader(46, 60, tip[0] - 1, n((tip[1] + tip[2]) / 2))));
    // olho inteiro, pequeno: a córnea vira um cone
    s.push(E('path', { 'class': 'div', d: 'M16,224 L384,224' }) + T(16, 248, R.olho) +
      E('g', { 'data-k': 'mA' }, T(16, 270, R.antes1, 'lb lb--m') + T(16, 292, R.antes2, 'lb lb--m')) +
      E('g', { 'data-k': 'mB', style: hide() }, T(16, 270, R.depois1, 'lb lb--m') + T(16, 292, R.depois2, 'lb lb--m')) +
      E('circle', { 'class': 'fw', cx: MI.x, cy: MI.y, r: MI.r }) +
      E('path', { 'class': 'ret ret--s', d: 'M335.4,241.3 A27,27 0 0,1 335.4,282.7' }) +
      E('ellipse', { 'class': 'mlens', cx: 300.5, cy: MI.y, rx: 4, ry: 11 }) +
      E('path', { 'class': 'ol ol--s', d: 'M295,242.7 A30,30 0 1,1 295,281.3' }) +
      E('path', { 'class': 'ghost', 'data-k': 'mg', d: miniCone(14, 1), style: hide() }) +
      E('path', { 'class': 'ol ol--s', 'data-k': 'mc', d: miniCone(14, 1) }));

    return {
      markup: svg(id, c, s.join('')),
      build: function (root) {
        var $ = q(root), i;
        var bondEls = [].slice.call(root.querySelectorAll('.bond'));
        for (i = 0; i < bondEls.length; i++) prep(bondEls[i]);
        // as ligações aparecem do centro para as bordas
        bondEls.sort(function (a, b) { return Math.abs(a.getAttribute('data-x') - 200) - Math.abs(b.getAttribute('data-x') - 200); });
        var fibs = [$('fb0'), $('fb1'), $('fb2'), $('fb3')];
        origins($, ['drop', 'spl', 'drop2', 'spl2']);
        gsap.set($('dev'), { y: -72 });
        gsap.set($('lensC'), { y: -80 });
        var tl = gsap.timeline({ paused: true });
        tl.addLabel('s0');
        // 1. ceratocone: a córnea afina no centro e se deforma em cone
        tl.addLabel('kc');
        for (i = 0; i < morph.length; i++) tl.to($(morph[i][0]), { attr: { d: morph[i][1] }, duration: 2.2, ease: 'power2.inOut' }, 'kc');
        tl.to($('mc'), { attr: { d: miniCone(27, 3) }, duration: 2.2, ease: 'power2.inOut' }, 'kc')
          .to($('mg'), { opacity: 1, duration: 0.5 }, 'kc+=0.4')
          .to($('mA'), { opacity: 0, duration: 0.4 }, 'kc+=0.3')
          .to($('mB'), { opacity: 1, duration: 0.4 }, 'kc+=0.8')
          .addLabel('s1');
        // 2. colírio anestésico
        tl.add(dropTl($, surfC - 40 - 10)).addLabel('s2');
        // 3. o epitélio do centro é retirado
        tl.to([$('epC'), $('antC')], { opacity: 0, y: -6, duration: 1.4, ease: 'power1.inOut' })
          .to($('intC'), { strokeWidth: 2.2, duration: 1.4, ease: 'power1.inOut' }, '<')
          .addLabel('s3');
        // 4. gotas de riboflavina; o colírio penetra no estroma
        tl.to($('lbR'), { opacity: 1, duration: 0.4 })
          .add(dropTl($, stC - 40 - 10, '2', 2), '<')
          .to($('rbClip'), { attr: { height: 115 }, duration: 2, ease: 'power1.inOut' }, '-=0.9')
          .addLabel('s4');
        // 5. luz ultravioleta: surgem novas ligações entre as fibras
        tl.to($('lbR'), { opacity: 0, duration: 0.3 })
          .to($('dev'), { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' }, '<')
          .to($('uv'), { opacity: 1, duration: 0.5 })
          .addLabel('uv')
          .to($('lbL'), { opacity: 1, duration: 0.4 }, 'uv+=0.3');
        var gap = 0.09, uvDur = 0.5 + bondEls.length * gap + 0.4;
        for (i = 0; i < bondEls.length; i++) tl.add(drawTo(bondEls[i], 0.35), 'uv+=' + n(0.3 + i * gap));
        for (i = 0; i < 4; i++) tl.to(fibs[i], { attr: { d: fine(-10, 410, fiber(i, yEk, yPk, AMP1)) }, duration: uvDur - 0.3, ease: 'power1.inOut' }, 'uv+=0.3');
        tl.to(fibs, { strokeOpacity: 0.85, duration: uvDur - 0.3, ease: 'power1.inOut' }, 'uv+=0.3')
          .fromTo($('uvl'), { strokeDashoffset: 0 }, { strokeDashoffset: -48, duration: uvDur, ease: 'none' }, 'uv')
          .to($('uv'), { opacity: 0, duration: 0.4 }, 'uv+=' + n(uvDur))
          .to($('dev'), { y: -72, opacity: 0, duration: 0.6, ease: 'power2.in' })
          .addLabel('s5');
        // 6. lente de proteção; a riboflavina sai e o epitélio cresce de novo
        tl.to($('rb'), { opacity: 0, duration: 1.2 })
          .to($('lensC'), { opacity: 1, duration: 0.3 }, '<')
          .to($('lensC'), { y: 0, duration: 1.4, ease: 'power2.out' }, '<')
          .addLabel('grow')
          .to($('ecL'), { attr: { width: 200 - Z0 + 1.5 }, duration: 2.4, ease: 'power1.inOut' }, 'grow')
          .to($('ecR'), { attr: { x: 198.5, width: Z1 - 200 + 2.5 }, duration: 2.4, ease: 'power1.inOut' }, 'grow')
          .to($('intC'), { strokeWidth: 1, duration: 2.4, ease: 'power1.inOut' }, 'grow')
          .addLabel('s6');
        return tl;
      }
    };
  }

  var BUILD = {
    catarata: function (c, id) { return catarata(c, id); },
    lasik: function (c, id) { return cornea(c, id, 'lasik'); },
    prk: function (c, id) { return cornea(c, id, 'prk'); },
    crosslinking: function (c, id) { return crosslinking(c, id); }
  };

  /* ============================================================
     CONTROLES: um "tocador" por aba
     ============================================================ */
  function Player(key, panel) {
    var self = this, c = DATA.cirurgias[key];
    this.key = key; this.c = c; this.panel = panel; this.step = 0; this.n = c.etapas.length;
    this.art = BUILD[key](c, 'sv-' + key);
    var dots = '';
    for (var i = 0; i < this.n; i++) {
      dots += '<li><button type="button" class="surg__dot" data-go="' + i + '" aria-label="' + esc(C.etapa + ' ' + (i + 1) + ': ' + c.etapas[i].titulo) + '"><span aria-hidden="true">' + (i + 1) + '</span></button></li>';
    }
    panel.innerHTML =
      '<div class="surg__grid">' +
        '<div class="surg__stage">' + this.art.markup + '</div>' +
        '<div class="surg__info">' +
          '<p class="surg__sum">' + esc(c.resumo) + '</p>' +
          '<ol class="surg__dots" aria-label="' + esc(C.irPara) + '">' + dots + '</ol>' +
          '<div class="surg__live" aria-live="polite" aria-atomic="true">' +
            '<p class="surg__count"></p><h3 class="surg__title"></h3><p class="surg__text"></p>' +
          '</div>' +
          '<div class="surg__nav">' +
            '<button type="button" class="btn btn--ghost surg__prev" data-prev><svg class="ic" aria-hidden="true"><use href="#i-left"></use></svg><span>' + esc(C.anterior) + '</span></button>' +
            '<button type="button" class="btn surg__next" data-next><span>' + esc(C.proxima) + '</span><svg class="ic" aria-hidden="true"><use href="#i-right"></use></svg></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="surg__foot">' +
        '<p class="surg__legend">' + esc(DATA.legenda) + '</p>' +
        '<div class="surg__cta">' +
          '<a class="btn" href="' + WA + encodeURIComponent(c.whatsapp) + '" target="_blank" rel="noopener"><svg class="ic" aria-hidden="true"><use href="#i-wa"></use></svg>' + esc(DATA.botao) + '<span class="sr-only"> pelo WhatsApp (abre em nova janela)</span></a>' +
          '<a class="surg__tel" href="tel:+551138131200">ou ligue <span class="nw">(11) 3813-1200</span></a>' +
        '</div>' +
      '</div>';
    this.svg = panel.querySelector('svg');
    this.count = panel.querySelector('.surg__count');
    this.title = panel.querySelector('.surg__title');
    this.text = panel.querySelector('.surg__text');
    this.prev = panel.querySelector('[data-prev]');
    this.next = panel.querySelector('[data-next]');
    this.dots = panel.querySelectorAll('.surg__dot');
    this.prev.addEventListener('click', function () { self.go(self.step - 1); });
    this.next.addEventListener('click', function () { self.go(self.step === self.n - 1 ? 0 : self.step + 1); });
    panel.querySelector('.surg__dots').addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (b) self.go(+b.getAttribute('data-go'));
    });
    panel.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var onDot = e.target.classList && e.target.classList.contains('surg__dot');
      self.go(self.step + (e.key === 'ArrowRight' ? 1 : -1));
      if (onDot) self.dots[self.step].focus();
    });
    if (!window.gsap) this.svg.parentNode.hidden = true;
    this.render();
  }
  Player.prototype.render = function () {
    var i = this.step, et = this.c.etapas[i];
    this.count.innerHTML = esc(C.etapa) + ' <b>' + (i + 1) + '</b> ' + esc(C.de) + ' ' + this.n;
    this.title.textContent = et.titulo;
    this.text.textContent = et.texto;
    for (var k = 0; k < this.dots.length; k++) {
      if (k === i) this.dots[k].setAttribute('aria-current', 'step'); else this.dots[k].removeAttribute('aria-current');
      this.dots[k].classList.toggle('is-done', k < i);
    }
    this.prev.setAttribute('aria-disabled', i === 0 ? 'true' : 'false');
    this.next.querySelector('span').textContent = i === this.n - 1 ? C.deNovo : C.proxima;
  };
  // monta a animação (só quando a seção aparece na tela) e toca a abertura
  Player.prototype.start = function () {
    if (this.tl || !window.gsap) return;
    this.tl = this.art.build(this.svg);
    var to = 's' + (this.step + 1);
    if (still() || this.step > 0) this.tl.seek(to, false);
    else this.tw = this.tl.tweenFromTo('s0', to);
  };
  Player.prototype.go = function (i) {
    if (i < 0 || i >= this.n || i === this.step) return;
    var from = this.step;
    this.step = i;
    this.render();
    if (!this.tl) { this.start(); return; }
    var tl = this.tl, to = 's' + (i + 1), svgEl = this.svg;
    if (this.tw) this.tw.kill();
    gsap.killTweensOf(svgEl);
    svgEl.style.opacity = '';
    if (still()) { tl.seek(to, false); return; }
    if (Math.abs(i - from) === 1) {
      // etapa vizinha: toca o trecho (para trás um pouco mais rápido)
      var dist = Math.abs(tl.labels[to] - tl.time());
      this.tw = tl.tweenTo(to, { duration: i > from ? dist : dist / 1.7, ease: 'none' });
    } else {
      // salto: troca direta com um esmaecer curto
      this.tw = gsap.timeline()
        .to(svgEl, { opacity: 0, duration: 0.18, ease: 'power1.in' })
        .add(function () { tl.seek(to, false); })
        .to(svgEl, { opacity: 1, duration: 0.3, ease: 'power1.out' });
    }
  };

  /* ---------- abas ---------- */
  var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
  // near: a seção está chegando perto (monta o desenho); seen: apareceu (anima)
  var players = {}, near = false, seen = false, current = null;
  function keyOf(tab) { return tab.getAttribute('data-cirurgia'); }
  function panelOf(tab) { return d.getElementById(tab.getAttribute('aria-controls')); }
  function player(tab) {
    var k = keyOf(tab);
    if (!players[k]) players[k] = new Player(k, panelOf(tab));
    return players[k];
  }
  function select(tab, focus) {
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i] === tab;
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[i].tabIndex = on ? 0 : -1;
      panelOf(tabs[i]).hidden = !on;
    }
    current = tab;
    if (near) { var pl = player(tab); if (seen) pl.start(); }
    if (focus) tab.focus();
  }
  // nome das abas vem do arquivo de textos
  for (var a = 0; a < tabs.length; a++) {
    var cc = DATA.cirurgias[keyOf(tabs[a])];
    if (cc && cc.aba) tabs[a].textContent = cc.aba;
  }
  box.querySelector('[role="tablist"]').addEventListener('keydown', function (e) {
    var i = tabs.indexOf(e.target), j = -1;
    if (i < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    if (j < 0) return;
    e.preventDefault();
    select(tabs[j], true);
  });
  for (var t = 0; t < tabs.length; t++) tabs[t].addEventListener('click', function () { select(this, false); });

  // endereço direto para uma cirurgia: /#cirurgia-catarata, /#cirurgia-lasik, /#cirurgia-prk, /#cirurgia-crosslinking
  function fromHash() {
    var m = /^#cirurgia-(catarata|lasik|prk|crosslinking)$/.exec(location.hash);
    if (!m) return null;
    for (var i = 0; i < tabs.length; i++) if (keyOf(tabs[i]) === m[1]) return tabs[i];
    return null;
  }
  window.addEventListener('hashchange', function () { var tb = fromHash(); if (tb) select(tb, false); });

  box.classList.add('is-ready');
  select(fromHash() || tabs[0], false);

  // Nada pesa no carregamento da página: o desenho é montado quando a seção
  // chega perto da tela (com o navegador ocioso) e a animação só começa
  // quando ela aparece de fato.
  function onNear() { if (near) return; near = true; select(current, false); }
  function onSeen() { if (seen) return; onNear(); seen = true; player(current).start(); }
  function anyIn(en) { for (var i = 0; i < en.length; i++) if (en[i].isIntersecting) return true; return false; }
  if ('IntersectionObserver' in window) {
    var ioNear = new IntersectionObserver(function (en) {
      if (!anyIn(en)) return;
      ioNear.disconnect();
      if (window.requestIdleCallback) requestIdleCallback(onNear, { timeout: 600 }); else setTimeout(onNear, 60);
    }, { rootMargin: '700px 0px 700px 0px' });
    var ioSeen = new IntersectionObserver(function (en) {
      if (anyIn(en)) { ioSeen.disconnect(); onSeen(); }
    }, { rootMargin: '0px 0px -25% 0px' });
    ioNear.observe(box);
    ioSeen.observe(box);
  } else onSeen();
})();
