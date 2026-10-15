/* Shared behaviour for the homepage and case-study pages.
   Every feature checks for its elements first, so one file serves all pages. */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Mobile navigation ---------- */
  var menuBtn = $('.menu-btn'), panel = $('#nav-panel');
  if (menuBtn && panel) {
    var setMenu = function (open) {
      panel.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Active section in nav / case-study contents ---------- */
  function trackActive(links) {
    var map = {};
    links.forEach(function (a) {
      var id = (a.getAttribute('href') || '').split('#')[1];
      var el = id && document.getElementById(id);
      if (el) map[id] = a;
    });
    var ids = Object.keys(map);
    if (!ids.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) { l.removeAttribute('aria-current'); });
        map[e.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  }
  trackActive($$('.nav-links a[href^="#"]'));
  trackActive($$('.toc a'));

  /* ---------- Reveal on scroll ---------- */
  var rv = $$('.rv');
  if (rv.length && 'IntersectionObserver' in window && !RM.matches) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    rv.forEach(function (el) { rio.observe(el); });
  } else {
    rv.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Work-card light that follows the pointer ---------- */
  $$('.work-card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Accessible tabs (roving tabindex, arrow keys) ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p && !list.hasAttribute('data-single-panel')) p.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = tabs[(i + 1) % tabs.length];
        else if (k === 'ArrowLeft' || k === 'ArrowUp') n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (k === 'Home') n = tabs[0];
        else if (k === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  });

  /* ---------- Count-up for impact numbers (keeps suffix markup) ---------- */
  var nums = $$('[data-count]');
  if (nums.length && 'IntersectionObserver' in window && !RM.matches) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, target = +el.dataset.count, node = el.firstChild, t0 = performance.now();
        if (!node || node.nodeType !== 3) return;
        (function step(t) {
          var p = Math.min(1, (t - t0) / 900), k = 1 - Math.pow(1 - p, 3);
          node.nodeValue = String(Math.round(target * k));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* ---------- A. Story guardrail checker ---------- */
  (function () {
    var gw = $('#gw'), gt = $('#gt');
    if (!gw || !gt) return;
    var KNOWN = ('a an and the is was are can go up down in on at it its he she they we you i to of for with big little red blue green tree sky sun day night cat dog bird fish boy girl man mom dad run ran sat sit fly flew saw see look come came get got had has have like likes play plays jump hop top out off back home good new old fast slow help here there this that then them his her my your one two three all some not no yes very so but or if when what who where why how make made take took put want went find scared dark monster hurt sad cry lost alone').split(' ');
    var UNSAFE = 'scared scary afraid fear monster dark hurt pain cry cried sad died die dead blood kill killed fight war gun weapon lost alone terrified catastrophic devastation'.split(' ');
    function syl(w) {
      w = w.toLowerCase().replace(/[^a-z]/g, ''); if (!w) return 0;
      var m = w.match(/[aeiouy]{1,2}/g), n = m ? m.length : 1;
      if (/e$/.test(w) && n > 1) n--;
      return Math.max(1, n);
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function run() {
      var target = (gw.value || '').trim().toLowerCase().replace(/[^a-z]/g, '');
      var text = gt.value || '', words = text.toLowerCase().match(/[a-z']+/g) || [];
      var sent = (text.match(/[.!?]+/g) || []).length || 1;
      var unk = []; words.forEach(function (w) { if (w !== target && KNOWN.indexOf(w) === -1 && unk.indexOf(w) === -1) unk.push(w); });
      var sy = 0; words.forEach(function (w) { sy += syl(w); });
      var fk = words.length ? (0.39 * (words.length / sent) + 11.8 * (sy / words.length) - 15.59) : 0;
      var bad = []; words.forEach(function (w) { if (UNSAFE.indexOf(w) > -1 && bad.indexOf(w) === -1) bad.push(w); });
      var reps = words.filter(function (w) { return w === target; }).length, lenOk = words.length <= 40;
      var ck = [
        { ok: unk.length === 0, t: 'Vocabulary', d: unk.length === 0 ? 'Every word except the target is in the known-word list.' : 'Outside the list: ' + unk.slice(0, 6).join(', ') },
        { ok: fk < 3, t: 'Complexity', d: 'Flesch-Kincaid grade ' + fk.toFixed(1) + (fk < 3 ? ', below the third-grade ceiling.' : ', above the third-grade ceiling.') },
        { ok: bad.length === 0, t: 'Content safety', d: bad.length === 0 ? 'Nothing scary, sad or violent.' : 'Flagged: ' + bad.join(', ') + '.' },
        { ok: reps >= 2 && lenOk, t: 'Structure', d: 'Target repeated ' + reps + (reps === 1 ? ' time' : ' times') + ', ' + words.length + ' words' + (lenOk ? ' within the 40-word limit.' : ', over the 40-word limit.') }
      ];
      var pass = ck.filter(function (c) { return c.ok; }).length;
      var score = pass === 4 ? Math.min(100, 90 + Math.round((3 - fk) * 3)) : Math.round(pass / 4 * 100);
      var ok = score >= 90;
      $('#gscore').textContent = score;
      var v = $('#gverdict');
      v.textContent = ok ? 'Passes — shown to the child' : 'Blocked — fallback shown';
      v.className = 'verdict ' + (ok ? 'pass' : 'fail');
      $('#gfall').hidden = ok;
      var fw = (target || 'word').toUpperCase();
      $('#gfw').textContent = fw; $('#gfw2').textContent = fw;
      $('#gchecks').innerHTML = ck.map(function (c) {
        return '<div class="check"><span class="ic ' + (c.ok ? 'y' : 'n') + '" aria-hidden="true">' + (c.ok ? '✓' : '✕') + '</span><div><b>' + c.t + ' <span class="sr-only">' + (c.ok ? 'passed' : 'failed') + '</span></b><span>' + esc(c.d) + '</span></div></div>';
      }).join('');
    }
    gw.addEventListener('input', run); gt.addEventListener('input', run);
    $$('.gp').forEach(function (b) { b.addEventListener('click', function () { gw.value = b.dataset.w; gt.value = b.dataset.t; run(); }); });
    run();
  })();

  /* ---------- B. Pricing simulator (projections only) ---------- */
  (function () {
    var e1 = $('#e1'); if (!e1) return;
    var e2 = $('#e2'), e3 = $('#e3'), e4 = $('#e4');
    var BASE = { e1: 500, e2: 20, e3: 10, e4: 6.5 };
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };
    function calc() {
      var u = +e1.value, d = +e2.value, f = +e3.value, c = +e4.value;
      if (d + f > 100) { f = 100 - d; e3.value = f; }
      $('#o1').textContent = u.toLocaleString('en-US');
      $('#o2').textContent = d + '%';
      $('#o3').textContent = f + '%';
      $('#o4').textContent = '$' + c.toFixed(2);
      e1.setAttribute('aria-valuetext', u.toLocaleString('en-US') + ' users');
      e2.setAttribute('aria-valuetext', d + ' percent');
      e3.setAttribute('aria-valuetext', f + ' percent');
      e4.setAttribute('aria-valuetext', c.toFixed(2) + ' dollars');
      var dn = Math.round(u * d / 100), fn = Math.round(u * f / 100), pay = dn + fn;
      var mrr = dn * 9.99 + fn * 17.99, m = mrr > 0 ? ((mrr - pay * c) / mrr * 100) : 0;
      $('#r1').textContent = money(mrr);
      $('#r2').textContent = money(mrr * 12);
      $('#r3').textContent = (pay === 0 ? '—' : Math.round(m) + '%');
      $('#r4').textContent = pay.toLocaleString('en-US');
      $('#mfill').style.width = Math.max(0, Math.min(100, m)) + '%';
      var note = $('#econote'), msg, tone;
      if (pay === 0) { msg = 'No paying users. The free tier alone has no path to covering inference cost.'; tone = 'callout--rose'; }
      else if (m < 0) { msg = 'Margin is negative. At this cost to serve every new paying user loses money, and the fix is routing cheaper work to a smaller model, not raising price.'; tone = 'callout--rose'; }
      else if (m < 47) { msg = 'Below the modeled 47–61% band. Thin enough that support costs, which this model excludes, would erase it.'; tone = 'callout--amber'; }
      else if (m <= 61) { msg = 'Inside the modeled 47–61% band from the August 2026 pricing strategy.'; tone = 'callout--cyan'; }
      else { msg = 'Above the modeled 47–61% band — usually a sign the cost-to-serve assumption is optimistic.'; tone = 'callout--amber'; }
      note.className = 'callout ' + tone;
      note.innerHTML = '<p>' + msg + '</p><p class="small" style="margin:0">Projection — not booked revenue.</p>';
    }
    [e1, e2, e3, e4].forEach(function (i) { i.addEventListener('input', calc); });
    $('#ereset').addEventListener('click', function () {
      Object.keys(BASE).forEach(function (k) { document.getElementById(k).value = BASE[k]; });
      calc();
    });
    calc();
  })();

  /* ---------- C. Product decision explorer ---------- */
  (function () {
    var box = $('#dopts'); if (!box) return;
    var DEC = [
      { proj: 'Instant Order Resolution', url: 'work/instant-order-resolution.html', q: 'Uber Eats is the number two player at roughly 24% US share. Which wedge is actually defensible against DoorDash?', opts: ['Match DoorDash on restaurant selection', 'Compete on delivery speed', 'Undercut on pricing and fees', 'Own post-failure order resolution'], ans: 3, chose: 'Own post-failure order resolution, what happens after an order goes wrong.', ev: 'Uber Eats trails on order accuracy, 88% against DoorDash’s 98%. That gap looks like a liability, but it means the failure moment happens more often and is worth more to fix. Uber Eats also holds a cross-subsidy advantage from rides that DoorDash cannot replicate. (Market figures are dated research from the case study.)', tr: 'The three obvious options all require outspending a larger incumbent on its own terms. Selection and speed are won with capital, price is won with margin. None of those are available to the challenger.', ch: 'If Uber Eats closed the accuracy gap the wedge would shrink, because the feature’s value scales with how often orders fail. I would also abandon it if the cross-subsidy were regulated away.' },
      { proj: 'Interviewer Prep Coach', url: 'work/interviewer-prep-coach.html', q: 'The AI has access to candidate data and interview feedback. How far should it go?', opts: ['Score and rank candidates', 'Draft feedback for interviewers', 'Summarize approved data and suggest job-related questions only', 'Recommend hire or no-hire with a confidence level'], ans: 2, chose: 'Summarize approved data and suggest job-related questions. Nothing else.', ev: 'Discovery across recruiter, interviewer and hiring-manager personas found the real gap was coordination, not judgment. The scoring capability solved a problem nobody named.', tr: 'Scoring is the feature buyers ask for in demos and the one that creates legal exposure, fairness risk and a product that makes decisions it cannot defend. I gave up obvious demo appeal for a product that survives a compliance review.', ch: 'Nothing in the current regulatory environment. If an auditable, jurisdiction-cleared fairness standard existed and a customer required scoring, I would revisit it as an explicitly human-reviewed suggestion, never an automated decision.' },
      { proj: 'WonderWord AI', url: 'work/wonderword.html', q: 'Teachers are the highest-leverage users. Do they go in the MVP?', opts: ['Build the teacher portal in the MVP', 'Defer teachers until consumer demand is proven', 'Build a read-only teacher view as a compromise'], ans: 1, chose: 'Defer. Consumer demand first, institutional distribution second.', ev: 'Classroom rostering, district procurement and FERPA scope would have consumed the entire eight-week MVP window before a single family proved the core loop works.', tr: 'Teachers are the better long-term business and the slower one to reach. Deferring them costs distribution leverage; building them costs the chance to learn whether the product works at all.', ch: 'A school district committing to a paid pilot before launch would reverse this immediately. That is demand evidence, not a bet on it.' },
      { proj: 'Alert Triage Copilot', url: 'work/alert-triage-copilot.html', q: 'The retrieval layer scored well on the first evaluation. How do you measure whether it actually works?', opts: ['Cumulative accuracy across the full dataset', 'A chronological split, training on earlier incidents and testing on later ones', 'Human spot-check of a sample'], ans: 1, chose: 'A chronological split. I re-ran the whole evaluation after the cumulative measure proved misleading.', ev: 'The cumulative measure let the system retrieve remediations that in production would not have existed yet. It was scoring well by looking at the future.', tr: 'The corrected number was worse, and it changed the product’s phasing and requirements. I had a good result and chose to invalidate it.', ch: 'Nothing. This is the correct method for anything retrieving from a growing incident history. The lesson generalizes: if an offline metric looks strong, check whether the split leaks time.' }
    ];
    var tabs = $$('.dec-tabs [data-d]'), reveal = $('#dreveal'), cur = 0;
    function render(k) {
      cur = k;
      var d = DEC[k];
      tabs.forEach(function (t, n) { t.setAttribute('aria-pressed', String(n === k)); });
      $('#dproj').textContent = d.proj;
      $('#dq').textContent = d.q;
      box.innerHTML = d.opts.map(function (o, i) {
        return '<button class="opt" type="button" data-i="' + i + '"><span class="k" aria-hidden="true">' + String.fromCharCode(65 + i) + '</span><span>' + o + '</span></button>';
      }).join('');
      reveal.hidden = true;
      $$('.opt', box).forEach(function (btn) { btn.addEventListener('click', function () { choose(+btn.dataset.i); }); });
    }
    function choose(i) {
      var d = DEC[cur];
      $$('.opt', box).forEach(function (x) {
        var n = +x.dataset.i;
        x.disabled = true;
        var tag = '';
        if (n === d.ans) { x.classList.add('is-doc'); tag = n === i ? 'Your pick · My decision' : 'My decision'; }
        else if (n === i) { x.classList.add('is-mine'); tag = 'Your pick'; }
        if (tag) x.insertAdjacentHTML('beforeend', '<span class="tag">' + tag + '</span>');
      });
      $('#dres').textContent = i === d.ans ? 'You made the same call.' : 'I went a different way.';
      $('#dchose').textContent = d.chose;
      $('#dev').textContent = d.ev;
      $('#dtr').textContent = d.tr;
      $('#dch').textContent = d.ch;
      var link = $('#dlink');
      link.href = d.url;
      link.textContent = 'Read the ' + d.proj + ' case study →';
      reveal.hidden = false;
      reveal.focus({ preventScroll: true });
    }
    tabs.forEach(function (t) { t.addEventListener('click', function () { render(+t.dataset.d); }); });
    $('#dretry').addEventListener('click', function () { render(cur); var f = $('.opt', box); if (f) f.focus(); });
    render(0);
  })();

  /* ---------- Copy email ---------- */
  var cm = $('#copymail');
  if (cm) {
    cm.addEventListener('click', function () {
      var addr = cm.dataset.email, status = $('#copy-status'), orig = cm.textContent;
      var done = function (msg) {
        cm.textContent = msg; if (status) status.textContent = msg;
        setTimeout(function () { cm.textContent = orig; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(addr).then(function () { done('Copied'); }, function () { done(addr); });
      } else { done(addr); }
    });
  }

  /* ---------- Screenshot tabs + journey (WonderWord case study) ---------- */
  (function () {
    var svg = $('#journey'); if (!svg) return;
    var J = [
      { n: 'Trigger', w: 'Worksheet comes home in the backpack', f: 'Dread', v: 2, p: 'Nightly power struggle. The homework is a thing that happens to the family.', x: 'Reframed as a game, not homework.', num: '', lab: '' },
      { n: 'Capture', w: 'Child or parent photographs the page', f: 'Skeptical', v: 3, p: 'OCR fails on crumpled, glared, third-generation photocopies.', x: 'Auto-crop, deskew and shadow strip, with capture to text inside the latency budget.', num: '3', lab: 'seconds, capture to interactive text' },
      { n: 'Read', w: 'Reads aloud with karaoke highlighting', f: 'Engaged', v: 6, p: 'Losing their place in dense text.', x: 'Highlighting stays locked to the child’s actual position and rewinds rather than jumping ahead when they re-read a line.', num: '200', lab: 'milliseconds, maximum sync latency' },
      { n: 'Miscue', w: 'Says “bed” instead of “bird”', f: 'Deflated', v: 1, p: 'Correction feels like failure. This is where the child decides whether to come back tomorrow.', x: 'No red X. A two-sentence story starring the missed word, validated by four guardrails before it is ever shown.', num: '90', lab: 'minimum validation score to show a story' },
      { n: 'Reinforce', w: 'Reads the story, hears phonemes, retries', f: 'Proud', v: 9, p: 'Drilling is boring, and a bored six-year-old is a churned six-year-old.', x: 'A four-tab modal covering story, phonics, listen and practice, plus badges and a mascot that reacts.', num: '4', lab: 'tabs in the correction modal' },
      { n: 'Report', w: 'Parent opens the progress report', f: 'Relieved', v: 7, p: 'No idea where the child is actually stuck.', x: 'WCPM trend, a phonics deficit map, and one off-screen game to play tonight.', num: '3', lab: 'sessions before a trend is shown' }
    ];
    var W = 760, H = 200, PL = 30, PR = 30, PT = 20, PB = 34;
    function X(i) { return PL + (W - PL - PR) * (i / (J.length - 1)); }
    function Y(v) { return PT + (H - PT - PB) * (1 - v / 10); }
    var pts = J.map(function (d, i) { return X(i).toFixed(1) + ',' + Y(d.v).toFixed(1); }).join(' ');
    var h = '<polyline class="jl" points="' + pts + '"/>';
    J.forEach(function (d, i) {
      h += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + d.n.toUpperCase() + '</text>';
      h += '<circle class="jd" data-j="' + i + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(d.v).toFixed(1) + '" r="7"/>';
    });
    svg.innerHTML = h;
    var tabs = $$('#jtabs [role="tab"]'), dots = $$('.jd', svg);
    function pick(k) {
      var d = J[k];
      dots.forEach(function (c, n) { c.classList.toggle('on', n === k); });
      $('#jname').textContent = d.n + ' — ' + d.f;
      $('#jwhat').textContent = d.w;
      $('#jpain').textContent = d.p;
      $('#jfix').textContent = d.x;
      var m = $('#jmet');
      if (d.num) { m.hidden = false; $('#jnum').textContent = d.num; $('#jlab').textContent = d.lab; } else { m.hidden = true; }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
    });
    // keep the generic tab handler in sync: observe aria-selected changes from keyboard nav
    if ('MutationObserver' in window) {
      new MutationObserver(function () {
        tabs.forEach(function (t, i) { if (t.getAttribute('aria-selected') === 'true') pick(i); });
      }).observe($('#jtabs'), { attributes: true, subtree: true, attributeFilter: ['aria-selected'] });
    }
    pick(3);
  })();

  /* ---------- Lazy 3D hero ---------- */
  var scene = $('#scene');
  if (scene) {
    var wide = window.matchMedia('(min-width: 900px)');
    var canWebGL = (function () {
      try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
      catch (e) { return false; }
    })();
    var started = false;
    var start = function () {
      if (started || !wide.matches || RM.matches || !canWebGL) return;
      started = true;
      import('./hero3d.js').then(function (m) { m.mount(scene); }).catch(function () { /* static composition stays */ });
    };
    var idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 300); };
    if (document.readyState === 'complete') idle(start); else window.addEventListener('load', function () { idle(start); });
    wide.addEventListener('change', start);
  }
})();
