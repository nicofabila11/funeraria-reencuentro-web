/* ===========================================================
   Funeraria Reencuentro — main.js
   Carga content.json y aplica al DOM (data-cms attributes).
   =========================================================== */

(async () => {
  let content = null;
  try {
    const res = await fetch('content.json?v=' + Date.now(), { cache: 'no-store' });
    if (res.ok) content = await res.json();
  } catch (e) {
    console.warn('No se pudo cargar content.json, usando defaults del HTML.', e);
  }

  if (content) applyContent(content);
  setupWhatsApp(content);
  setupNav();
  setupReveal();
})();

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function applyContent(content) {
  document.querySelectorAll('[data-cms]').forEach(el => {
    const v = get(content, el.getAttribute('data-cms'));
    if (typeof v === 'string') el.textContent = v;
  });

  document.querySelectorAll('[data-cms-html]').forEach(el => {
    const paths = el.getAttribute('data-cms-html').split('|');
    if (paths.length === 1) {
      const v = get(content, paths[0]);
      if (typeof v === 'string') el.innerHTML = v;
    } else if (paths.length === 2) {
      const pre = get(content, paths[0]);
      const em  = get(content, paths[1]);
      if (typeof pre === 'string' && typeof em === 'string') {
        const useEm = !!el.querySelector('em');
        const tag = useEm ? 'em' : 'span';
        const cls = useEm ? '' : ' class="serif-it"';
        el.innerHTML = esc(pre) + ' <' + tag + cls + '>' + esc(em) + '</' + tag + '>';
      }
    }
  });

  document.querySelectorAll('[data-cms-attr]').forEach(el => {
    const [path, attr, prefix] = el.getAttribute('data-cms-attr').split('|');
    const v = get(content, path);
    if (typeof v === 'string' && attr) {
      el.setAttribute(attr, (prefix || '') + v);
    }
  });

  document.querySelectorAll('[data-cms-bg]').forEach(el => {
    const v = get(content, el.getAttribute('data-cms-bg'));
    if (typeof v === 'string' && v) {
      el.style.backgroundImage = "url('" + v + "')";
    }
  });

  applyList(content, 'trust',              renderTrust);
  applyList(content, 'testimonios',        renderTestimonio);
  applyList(content, 'prevision.steps',    renderPrevStep);
  applyList(content, 'servicios.tarjetas', renderServicio);
  applyList(content, 'unicos.tarjetas',    renderUcard);
  applyList(content, 'salones.features',   renderSalonFeat);
}

function applyList(content, path, renderFn) {
  const items = get(content, path);
  if (!Array.isArray(items)) return;
  const container = document.querySelector(`[data-cms-list="${path}"]`);
  if (!container) return;
  const oldChildren = Array.from(container.children);
  container.innerHTML = items.map((item, i) => renderFn(item, oldChildren[i], i)).join('');
}

function renderTrust(item) {
  return `<div><b>${esc(item.number)}</b><span>${esc(item.label)}</span></div>`;
}

function renderTestimonio(item) {
  const n = Math.max(1, Math.min(5, Number(item.stars) || 5));
  const stars = '★'.repeat(n);
  return `<div class="quote reveal">
    <span class="mark">"</span>
    <div class="stars" aria-label="${n} estrellas">${stars}</div>
    <p>${esc(item.text)}</p>
    <div class="who"><span class="av">${esc(item.initials)}</span><div><b>${esc(item.name)}</b><small>${esc(item.role)}</small></div></div>
  </div>`;
}

function renderPrevStep(item) {
  return `<div class="prev-step"><span class="n">${esc(item.num)}</span><div class="t"><b>${esc(item.title)}</b><span>${esc(item.desc)}</span></div></div>`;
}

function renderServicio(item, oldNode) {
  const iconHtml = oldNode && oldNode.querySelector('.ic-wrap')
    ? oldNode.querySelector('.ic-wrap').outerHTML
    : '<div class="ic-wrap"></div>';
  return `<div class="scard reveal">${iconHtml}<h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p></div>`;
}

function renderUcard(item, oldNode, i) {
  const idx = oldNode && oldNode.classList && oldNode.classList.contains('u1') ? 'u1'
            : oldNode && oldNode.classList && oldNode.classList.contains('u2') ? 'u2'
            : oldNode && oldNode.classList && oldNode.classList.contains('u3') ? 'u3'
            : 'u' + (i + 1);
  const bg = item.image ? ` style="background-image:url('${esc(item.image)}')"` : '';
  return `<div class="ucard ${idx} reveal">
    <div class="bg" role="img" aria-label="${esc(item.image_alt || item.title)}"${bg}></div>
    <div class="c"><span class="tag">${esc(item.tag)}</span><h3>${esc(item.title)}</h3><p>${esc(item.desc)}</p></div>
  </div>`;
}

function renderSalonFeat(item) {
  return `<div><b>${esc(item.title)}</b><span>${esc(item.desc)}</span></div>`;
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
}

function setupWhatsApp(content) {
  const tel = (content && content.site && content.site.phone_wa) || '56968445574';
  const msgs = (content && content.wa_messages) || {
    general:   'Hola, vengo desde la página web de Funeraria Reencuentro y necesito información.',
    urgencia:  'Hola, necesito ayuda con un servicio funerario. ¿Me pueden orientar, por favor?',
    prevision: 'Hola, me interesa conocer las opciones de previsión / contratar un servicio en vida. ¿Podemos coordinar una reunión o llamada?',
    servicios: 'Hola, quisiera información sobre los servicios que ofrecen (cofres, decoración, asesoría, florería).',
    distingue: 'Hola, me interesa saber más sobre la carroza Jaguar / el carruaje a caballos para una despedida.',
    salones:   'Hola, quisiera consultar por la disponibilidad de los salones velatorios.'
  };
  const link = t => `https://wa.me/${tel}?text=${encodeURIComponent(t)}`;
  document.querySelectorAll('.js-wa').forEach(a => a.href = link(msgs.general));
  document.querySelectorAll('.js-wa-urgencia').forEach(a => a.href = link(msgs.urgencia));
  document.querySelectorAll('.js-wa-prevision').forEach(a => a.href = link(msgs.prevision));
  document.querySelectorAll('.js-wa-servicios').forEach(a => a.href = link(msgs.servicios));
  document.querySelectorAll('.js-wa-distingue').forEach(a => a.href = link(msgs.distingue));
  document.querySelectorAll('.js-wa-salones').forEach(a => a.href = link(msgs.salones));
}

function setupNav() {
  const nav = document.getElementById('nav');
  if (nav) addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));
  const burger = document.getElementById('burger');
  const links = document.getElementById('navlinks');
  if (burger && links) {
    burger.onclick = () => links.classList.toggle('open');
    links.querySelectorAll('a').forEach(a => a.onclick = () => links.classList.remove('open'));
  }
}

function setupReveal() {
  const io = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 3 * 0.1) + 's';
    io.observe(el);
  });
}
