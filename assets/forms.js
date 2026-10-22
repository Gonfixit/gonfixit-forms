/* ============================================================
   GONFIXIT Forms · motor de cuestionarios
   - Carga forms/<f>.json (+ clients/<c>.json para personalizar)
   - Pantalla de bienvenida con consentimiento RGPD obligatorio
   - Una pregunta por pantalla, teclado (Enter, A/B/C, ↑ ↓)
   - Lógica condicional (showIf), preset y skip por cliente
   - Borrador en localStorage por formulario
   - Resumen editable antes de enviar · POST a la API de gonfixit.com
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://gonfixit.com/api/forms';
  var params = new URLSearchParams(location.search);
  var FORM_ID = (params.get('f') || 'diagnostico').replace(/[^a-z0-9-]/g, '');
  var CLIENT_ID = (params.get('c') || '').replace(/[^a-z0-9-]/g, '');
  var PREVIEW = params.get('preview') === '1';

  var $screen = document.getElementById('screen');
  var $prog = document.getElementById('progBar');
  var $count = document.getElementById('count');
  var $nav = document.getElementById('navbtns');
  var $prev = document.getElementById('btnPrev');
  var $next = document.getElementById('btnNext');

  var form = null, client = null, questions = [], answers = {}, consent = { accepted: false, marketing: false };
  var step = -1; // -1 bienvenida · 0..n-1 preguntas · n resumen · n+1 gracias
  var diagnostico = null; // pre-diagnóstico devuelto por la API (o muestra en preview)
  var sinDiagnostico = false; // el envío entró pero el diagnóstico no llegó a tiempo: va por correo
  var DRAFT_KEY = 'gonfixit-forms:' + FORM_ID + (CLIENT_ID ? ':' + CLIENT_ID : '');

  /* ── utilidades ───────────────────────────────────────── */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function load(url) { return fetch(url, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }); }
  function saveDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ answers: answers, consent: consent, step: step, v: form.version })); } catch (e) {} }
  function loadDraft() { try { var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); if (d && d.v === form.version) { answers = d.answers || {}; consent = d.consent || consent; return d; } } catch (e) {} return null; }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
  function letter(i) { return String.fromCharCode(65 + i); }

  /* preguntas visibles según respuestas (showIf) y cliente (skip) */
  function visible() {
    var skip = (client && client.skip) || [];
    return form.questions.filter(function (q) {
      if (skip.indexOf(q.key) !== -1) return false;
      if (!q.showIf) return true;
      return [].concat(q.showIf).every(function (c) {
        var v = answers[c.key];
        var arr = Array.isArray(v) ? v : [v];
        if (c.in) return arr.some(function (x) { return c.in.indexOf(x) !== -1; });
        if (c.notIn) return !arr.some(function (x) { return c.notIn.indexOf(x) !== -1; });
        if (c.eq !== undefined) return v === c.eq;
        return true;
      });
    });
  }
  function optionLabel(q, v) { var o = (q.options || []).filter(function (o) { return o.value === v; })[0]; return o ? o.label : v; }
  function readable(q) {
    var v = answers[q.key];
    if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '';
    if (q.type === 'multi') return v.map(function (x) { return optionLabel(q, x); }).join(', ');
    if (q.type === 'single') return optionLabel(q, v);
    return String(v);
  }
  function valid(q) {
    var v = answers[q.key];
    var empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
    if (empty) return q.required ? 'Esta pregunta es obligatoria.' : '';
    if (q.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Revisa el correo, parece incompleto.';
    if (q.type === 'tel' && String(v).replace(/[^\d]/g, '').length < 6) return 'Revisa el teléfono.';
    if (q.min && String(v).trim().length < q.min) return 'Cuéntanoslo con un poco más de detalle.';
    if (q.max && String(v).length > q.max) return 'Demasiado largo, acorta un poco.';
    return '';
  }

  /* ── render ───────────────────────────────────────────── */
  function progress() {
    var n = questions.length;
    var pct = step < 0 ? 0 : step >= n ? 100 : Math.round(((step + 1) / n) * 100);
    $prog.style.width = pct + '%';
    $count.textContent = step >= 0 && step < n ? (step + 1) + ' / ' + n : step >= n ? 'Listo' : '';
    $nav.hidden = !(step >= 0 && step <= n);
    $prev.disabled = step <= -1;
    $next.disabled = step >= n;
  }

  function show(i) {
    questions = visible();
    step = Math.max(-1, Math.min(questions.length + 1, i));
    var html = step === -1 ? welcome() : step < questions.length ? question(questions[step]) : step === questions.length ? review() : thanks();
    $screen.replaceChildren(el(html));
    progress();
    bind();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var first = $screen.querySelector('input:not([type=checkbox]):not([type=radio]),textarea');
    if (first && step >= 0) setTimeout(function () { first.focus({ preventScroll: true }); }, 250);
    if (step <= questions.length) saveDraft();
  }

  function welcome() {
    var c = form.consent;
    var title = (client && client.title) || form.title;
    var intro = (client && client.intro) || form.intro;
    return '<div class="welcome">' +
      '<p class="kicker">' + esc(form.kicker) + '</p>' +
      '<h1>' + esc(title) + '</h1>' +
      '<p class="lead">' + esc(intro) + '</p>' +
      '<ul class="meta"><li>' + esc(form.duration) + '</li><li>Puedes parar y seguir después: se guarda en este dispositivo</li></ul>' +
      '<ol class="steps">' + form.next_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      '<div class="consent" id="consent">' +
        '<h2>' + esc(c.title) + '</h2>' +
        '<p>' + esc(c.text) + ' <a href="' + esc(c.privacy_url) + '" target="_blank" rel="noopener">' + esc(c.privacy_label) + '</a>.</p>' +
        '<label class="chk"><input type="checkbox" id="cAccept"' + (consent.accepted ? ' checked' : '') + '> <span>' + esc(c.accept_label) + ' <span class="req">*</span></span></label>' +
        '<label class="chk"><input type="checkbox" id="cMarketing"' + (consent.marketing ? ' checked' : '') + '> <span>' + esc(c.marketing_label) + '</span></label>' +
      '</div>' +
      '<div class="actions"><button type="button" class="btn btn--primary" id="start">Empezar <span class="sl">//</span></button><p class="hint">o pulsa <kbd>Enter</kbd></p></div>' +
      '<p class="status" id="status"></p>' +
    '</div>';
  }

  function question(q) {
    var n = questions.indexOf(q) + 1;
    var sec = form.sections.filter(function (s) { return s.id === q.section; })[0];
    var h = '<div class="qwrap" data-key="' + esc(q.key) + '">' +
      (sec ? '<p class="kicker">' + esc(sec.title) + '</p>' : '') +
      '<span class="qnum">' + n + '</span>' +
      '<h2 class="q">' + esc(q.label) + (q.required ? ' <span class="req">*</span>' : '') + '</h2>' +
      (q.help ? '<p class="help">' + esc(q.help) + '</p>' : '') +
      '<div class="field" id="field">';
    var v = answers[q.key];
    if (q.type === 'single' || q.type === 'multi') {
      var multi = q.type === 'multi';
      h += '<ul class="opts' + (q.options.length > 4 ? ' cols' : '') + '" role="' + (multi ? 'group' : 'radiogroup') + '">' + q.options.map(function (o, i) {
        var on = multi ? (v || []).indexOf(o.value) !== -1 : v === o.value;
        return '<li><label class="opt' + (on ? ' is-on' : '') + '"><span class="k">' + letter(i) + '</span><input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + esc(q.key) + '" value="' + esc(o.value) + '"' + (on ? ' checked' : '') + '><span>' + esc(o.label) + '</span></label></li>';
      }).join('') + '</ul>';
    } else if (q.type === 'textarea') {
      h += '<textarea class="in" id="inp" rows="3" maxlength="' + (q.max || 2000) + '" placeholder="' + esc(q.placeholder || '') + '">' + esc(v || '') + '</textarea>' +
        '<p class="hint"><kbd>Shift</kbd> + <kbd>Enter</kbd> para saltar de línea</p>';
    } else {
      var type = q.type === 'email' ? 'email' : q.type === 'tel' ? 'tel' : 'text';
      h += '<input class="in" id="inp" type="' + type + '" value="' + esc(v || '') + '" placeholder="' + esc(q.placeholder || '') + '"' +
        (q.autocomplete ? ' autocomplete="' + esc(q.autocomplete) + '"' : '') + (q.inputmode ? ' inputmode="' + esc(q.inputmode) + '"' : '') + (q.max ? ' maxlength="' + q.max + '"' : '') + '>';
    }
    h += '</div>' +
      '<div class="actions"><button type="button" class="btn" id="ok">' + (n === questions.length ? 'Ver resumen' : 'OK') + ' <span class="sl">//</span></button>' +
      '<p class="hint">pulsa <kbd>Enter</kbd>' + (q.type === 'single' || q.type === 'multi' ? ' o una letra' : '') + '</p></div>' +
      '<p class="status" id="status"></p></div>';
    return h;
  }

  function review() {
    var bySec = {};
    questions.forEach(function (q) { (bySec[q.section] = bySec[q.section] || []).push(q); });
    var h = '<div class="reviewwrap"><p class="kicker">Último paso</p><h1>Revisa y envía.</h1><p class="lead">Puedes corregir cualquier respuesta antes de enviarla.</p>';
    form.sections.forEach(function (s) {
      var qs = bySec[s.id]; if (!qs) return;
      h += '<p class="sect">' + esc(s.title) + '</p><ul class="review">' + qs.map(function (q) {
        var a = readable(q);
        return '<li><span class="q">' + esc(q.label) + '</span><span class="a">' + (a ? esc(a) : '<em>Sin responder</em>') + '</span><button type="button" data-edit="' + esc(q.key) + '">Editar</button></li>';
      }).join('') + '</ul>';
    });
    h += '<div class="actions"><button type="button" class="btn btn--primary" id="send">Enviar el cuestionario <span class="sl">//</span></button></div><p class="status" id="status"></p></div>';
    return h;
  }

  function thanks() {
    var t = form.thanks;
    var d = diagnostico;
    var h = '<div class="thanks"><span class="mark" aria-hidden="true">✓</span><h1>' + esc(d ? (t.title_diag || t.title) : t.title) + '</h1><p class="lead">' + esc(d ? (t.text_diag || t.text) : (sinDiagnostico && t.text_pending) || t.text) + '</p>';
    if (d) {
      h += '<section class="diag">' +
        '<p class="kicker">Pre-diagnóstico</p><p class="diag-sum">' + esc(d.resumen) + '</p>' +
        '<h2 class="diag-h">Dónde se te está yendo</h2><ol class="fugas">' + (d.fugas || []).map(function (f) {
          return '<li><strong>' + esc(f.titulo) + '</strong><p>' + esc(f.por_que) + '</p><p class="imp">' + esc(f.impacto_mes) + '</p></li>';
        }).join('') + '</ol>' +
        '<h2 class="diag-h">' + esc(t.next_title || 'Qué pasa ahora') + '</h2><p class="paso">' + esc(t.next_text || '') + '</p>' +
        '<p class="diag-note">' + esc(t.diag_note || '') + '</p>' +
      '</section>';
    }
    h += '<div class="actions"><a class="btn btn--primary" href="' + esc(t.whatsapp) + '" target="_blank" rel="noopener">' + esc(t.whatsapp_label) + '</a><a class="btn btn--line" href="' + esc(t.site) + '">' + esc(t.site_label) + '</a></div></div>';
    return h;
  }

  /* El servidor responde al instante y prepara el diagnóstico detrás: preguntamos cada 4 s hasta 5 min */
  var ESPERA = ['Leyendo tus respuestas…', 'Calculando dónde se te va el dinero…', 'Comparando con negocios parecidos…', 'Redactando tu pre-diagnóstico…', 'Ya casi está, un momento más…'];
  function esperar(job) {
    var inicio = Date.now(), n = 0;
    function tick() {
      var i = Math.min(ESPERA.length - 1, Math.floor((Date.now() - inicio) / 30000));
      setStatus(ESPERA[i] + ' No cierres la página.');
      fetch(API + '/estado/' + job, { cache: 'no-store' })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, json: j }; }); })
        .then(function (res) {
          var j = res.json || {};
          if (res.status === 200 && j.estado === 'listo') { diagnostico = j.diagnostico || null; sinDiagnostico = !diagnostico; return show(questions.length + 1); }
          if (res.status === 404 || j.estado === 'error' || Date.now() - inicio > 300000) { sinDiagnostico = true; return show(questions.length + 1); }
          n += 1; setTimeout(tick, 4000);
        })
        .catch(function () { if (Date.now() - inicio > 300000) { sinDiagnostico = true; return show(questions.length + 1); } setTimeout(tick, 6000); });
    }
    tick();
  }

  /* ── interacción ──────────────────────────────────────── */
  function setStatus(msg, ok) { var s = document.getElementById('status'); if (s) { s.textContent = msg || ''; s.className = 'status' + (ok ? ' ok' : ''); } }

  function collect(q) {
    if (q.type === 'multi') answers[q.key] = Array.prototype.map.call($screen.querySelectorAll('input:checked'), function (i) { return i.value; });
    else if (q.type === 'single') { var r = $screen.querySelector('input:checked'); answers[q.key] = r ? r.value : (answers[q.key] !== undefined ? answers[q.key] : undefined); }
    else { var inp = document.getElementById('inp'); if (inp) answers[q.key] = inp.value.trim(); }
  }

  function next() {
    if (step === -1) {
      var acc = document.getElementById('cAccept'), mk = document.getElementById('cMarketing');
      consent.accepted = !!(acc && acc.checked); consent.marketing = !!(mk && mk.checked);
      if (!consent.accepted) { document.getElementById('consent').classList.add('is-invalid'); setStatus('Para continuar necesitamos tu aceptación del tratamiento de datos.'); acc && acc.focus(); return; }
      consent.at = new Date().toISOString(); consent.version = form.consent.version;
      return show(0);
    }
    if (step < questions.length) {
      var q = questions[step];
      collect(q);
      var err = valid(q);
      if (err) { document.getElementById('field').classList.add('is-invalid'); setStatus(err); return; }
      return show(step + 1);
    }
  }

  function bind() {
    var start = document.getElementById('start'); if (start) start.onclick = next;
    var ok = document.getElementById('ok'); if (ok) ok.onclick = next;
    var send = document.getElementById('send'); if (send) send.onclick = submit;
    Array.prototype.forEach.call($screen.querySelectorAll('[data-edit]'), function (b) {
      b.onclick = function () { var k = b.getAttribute('data-edit'); var i = questions.map(function (q) { return q.key; }).indexOf(k); if (i >= 0) show(i); };
    });
    if (step >= 0 && step < questions.length) {
      var q = questions[step];
      Array.prototype.forEach.call($screen.querySelectorAll('.opt input'), function (inp) {
        inp.addEventListener('change', function () {
          Array.prototype.forEach.call($screen.querySelectorAll('.opt'), function (o) { o.classList.toggle('is-on', o.querySelector('input').checked); });
          document.getElementById('field').classList.remove('is-invalid'); setStatus('');
          collect(q); saveDraft();
          if (q.type === 'single') setTimeout(function () { show(step + 1); }, 220);
        });
      });
      var inp = document.getElementById('inp');
      if (inp) inp.addEventListener('input', function () { document.getElementById('field').classList.remove('is-invalid'); setStatus(''); collect(q); saveDraft(); });
    }
    if (step === -1) {
      var acc = document.getElementById('cAccept');
      if (acc) acc.addEventListener('change', function () { document.getElementById('consent').classList.remove('is-invalid'); setStatus(''); });
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      var ta = e.target && e.target.tagName === 'TEXTAREA';
      if (ta && e.shiftKey) return;
      if (step <= questions.length - 1 || step === -1) { e.preventDefault(); next(); }
      return;
    }
    if (step >= 0 && step < questions.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' && e.target.type !== 'radio' && e.target.type !== 'checkbox') return;
      if (tag === 'TEXTAREA') return;
      var q = questions[step];
      if ((q.type === 'single' || q.type === 'multi') && /^[a-zA-Z]$/.test(e.key)) {
        var idx = e.key.toUpperCase().charCodeAt(0) - 65;
        var inp = $screen.querySelectorAll('.opt input')[idx];
        if (inp) { inp.checked = q.type === 'multi' ? !inp.checked : true; inp.dispatchEvent(new Event('change', { bubbles: true })); e.preventDefault(); }
      }
    }
  });
  $prev.onclick = function () { if (step > -1) show(step - 1); };
  $next.onclick = function () { if (step < questions.length) next(); };

  /* ── envío ────────────────────────────────────────────── */
  function submit() {
    var btn = document.getElementById('send'); btn.disabled = true; setStatus('Enviando y preparando tu pre-diagnóstico… puede tardar un minuto. No cierres la página.');
    var payload = {
      form: form.id, version: form.version, client: CLIENT_ID || null, lang: form.lang || 'es',
      answers: questions.map(function (q) { return { key: q.key, section: q.section, question: q.label, value: answers[q.key] === undefined ? '' : answers[q.key], answer: readable(q) }; }),
      consent: { accepted: true, marketing: !!consent.marketing, version: consent.version, at: consent.at, text: form.consent.accept_label },
      meta: { url: location.href, referrer: document.referrer || '', sent_at: new Date().toISOString() },
      honeypot: ''
    };
    if (PREVIEW) { diagnostico = form.preview_diagnostico || null; setTimeout(function () { clearDraft(); show(questions.length + 1); }, 800); return; }
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok && j.ok, status: r.status, json: j }; }); })
      .then(function (res) {
        if (res.ok && res.json.pendiente && res.json.job) { clearDraft(); return esperar(res.json.job); }
        if (res.ok) { diagnostico = res.json.diagnostico || null; clearDraft(); show(questions.length + 1); return; }
        btn.disabled = false;
        if (res.status === 429) return setStatus('Demasiados envíos seguidos. Espera unos minutos y vuelve a intentarlo.');
        if (res.status === 400 && res.json.issues) return setStatus('Hay respuestas que no hemos podido validar: ' + Object.keys(res.json.issues).join(', ') + '.');
        setStatus((res.json && res.json.error) || 'No hemos podido enviarlo. Escríbenos por WhatsApp al +34 630 587 290 y lo resolvemos.');
      })
      .catch(function () { btn.disabled = false; setStatus('Error de conexión. Comprueba la red e inténtalo de nuevo, o escríbenos por WhatsApp.'); });
  }

  /* ── arranque ─────────────────────────────────────────── */
  var base = 'forms/' + FORM_ID + '.json';
  load(base).then(function (f) {
    form = f;
    document.title = f.title + ' · GONFIXIT';
    return CLIENT_ID ? load('clients/' + CLIENT_ID + '.json').catch(function () { return null; }) : null;
  }).then(function (c) {
    if (c && c.form === form.id) { client = c; Object.keys(c.preset || {}).forEach(function (k) { answers[k] = c.preset[k]; }); }
    var d = loadDraft();
    if (client) Object.keys(client.preset || {}).forEach(function (k) { answers[k] = client.preset[k]; });
    show(d && d.step >= 0 && d.step <= visible().length ? d.step : -1);
  }).catch(function (e) {
    $screen.replaceChildren(el('<div><p class="kicker">GONFIXIT</p><h1>No encontramos este cuestionario.</h1><p class="lead">Comprueba el enlace o escríbenos por WhatsApp al +34 630 587 290.</p></div>'));
    if (window.console) console.error(e);
  });
})();
