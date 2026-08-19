/* ===========================================================
   Funeraria Reencuentro — agradecimientos.js
   Sección de agradecimientos conectada a Firestore.
   Solo firebase-app y firebase-firestore (sin Analytics).
   =========================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, collection, query, where, orderBy, limit, startAfter,
  getDocs, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyCqkAZPwWijUA6Jo2IBxLW7PJn82Gz9k-c",
  authDomain: "reencuentro-9932f.firebaseapp.com",
  projectId: "reencuentro-9932f",
  storageBucket: "reencuentro-9932f.firebasestorage.app",
  messagingSenderId: "1084085199874",
  appId: "1:1084085199874:web:602c4b17c6df4597f4331b",
  measurementId: "G-YPSMEQFHPL"
};

const app = initializeApp(firebaseConfig);

/* App Check con reCAPTCHA v3: cuando se active en la consola de Firebase,
   pegar aquí la clave del sitio. Con la constante vacía, el sitio funciona
   igual que hoy (sin App Check). */
const RECAPTCHA_V3_SITE_KEY = '';
if (RECAPTCHA_V3_SITE_KEY) {
  import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-check.js')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
        isTokenAutoRefreshEnabled: true
      });
    })
    .catch(e => console.warn('No se pudo iniciar App Check.', e));
}

const db = getFirestore(app);
const col = collection(db, 'agradecimientos');

const PAGE_SIZE = 6;
const WA_LINK = 'https://wa.me/56968445574?text=' + encodeURIComponent(
  'Hola, vengo desde la página web de Funeraria Reencuentro y necesito información.'
);

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const $lista = document.getElementById('agr-lista');
const $estado = document.getElementById('agr-estado');
const $verMas = document.getElementById('agr-ver-mas');
const $form = document.getElementById('agr-form');
const $nombre = document.getElementById('agr-nombre');
const $mensaje = document.getElementById('agr-mensaje');
const $contador = document.getElementById('agr-contador');
const $estrellas = document.getElementById('agr-estrellas');
const $enviar = document.getElementById('agr-enviar');
const $confirmacion = document.getElementById('agr-confirmacion');
const $errNombre = document.getElementById('agr-error-nombre');
const $errMensaje = document.getElementById('agr-error-mensaje');

let ultimoDoc = null;       // cursor para startAfter
let modoLocal = false;      // fallback si falta el índice compuesto
let docsLocales = [];       // documentos ya ordenados (solo en modo local)
let mostrados = 0;

/* ---------- Presentación ---------- */

function fechaLegible(data) {
  if (typeof data.fechaTexto === 'string' && data.fechaTexto.trim() !== '') {
    return data.fechaTexto.trim();
  }
  const f = data.fecha && typeof data.fecha.toDate === 'function' ? data.fecha.toDate() : null;
  if (!f) return '';
  return MESES[f.getMonth()] + ' ' + f.getFullYear();
}

function avatarSVG() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'currentColor');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4Zm0 2.1c-3.9 0-7.2 2.2-7.2 5v1.3h14.4V19.1c0-2.8-3.3-5-7.2-5Z');
  svg.appendChild(p);
  return svg;
}

function crearTarjeta(data) {
  const card = document.createElement('article');
  card.className = 'agr-card';

  const quien = document.createElement('div');
  quien.className = 'agr-quien';

  const av = document.createElement('span');
  av.className = 'agr-av';
  av.appendChild(avatarSVG());

  const idBox = document.createElement('div');
  const nombre = document.createElement('b');
  nombre.textContent = data.nombre;
  idBox.appendChild(nombre);

  const fecha = fechaLegible(data);
  if (fecha) {
    const small = document.createElement('small');
    small.textContent = fecha;
    idBox.appendChild(small);
  }

  quien.appendChild(av);
  quien.appendChild(idBox);
  card.appendChild(quien);

  const n = Number(data.estrellas) || 0;
  if (n >= 1 && n <= 5) {
    const stars = document.createElement('div');
    stars.className = 'agr-stars';
    stars.setAttribute('aria-label', n + (n === 1 ? ' estrella' : ' estrellas'));
    stars.textContent = '★'.repeat(n);
    card.appendChild(stars);
  }

  const p = document.createElement('p');
  p.textContent = data.mensaje;
  card.appendChild(p);

  return card;
}

function mostrarError() {
  $estado.hidden = false;
  $estado.textContent = '';
  const msg = document.createElement('p');
  msg.textContent = 'No pudimos cargar los mensajes en este momento. Si necesitas hablar con nosotros, escríbenos.';
  const a = document.createElement('a');
  a.className = 'btn btn-wa agr-wa-fallback';
  a.href = WA_LINK;
  a.textContent = 'Escríbenos por WhatsApp';
  $estado.appendChild(msg);
  $estado.appendChild(a);
}

/* ---------- Carga desde Firestore ---------- */

async function cargarPagina() {
  $verMas.disabled = true;
  try {
    let docs;
    if (modoLocal) {
      docs = docsLocales.slice(mostrados, mostrados + PAGE_SIZE);
    } else {
      let q = query(col, where('visible', '==', true), orderBy('fecha', 'desc'), limit(PAGE_SIZE));
      if (ultimoDoc) {
        q = query(col, where('visible', '==', true), orderBy('fecha', 'desc'),
          startAfter(ultimoDoc), limit(PAGE_SIZE));
      }
      const snap = await getDocs(q);
      docs = snap.docs;
      if (snap.docs.length > 0) ultimoDoc = snap.docs[snap.docs.length - 1];
    }

    for (const d of docs) {
      $lista.appendChild(crearTarjeta(d.data()));
    }
    mostrados += docs.length;

    $estado.hidden = true;
    $lista.hidden = false;
    const hayMas = modoLocal ? mostrados < docsLocales.length : docs.length === PAGE_SIZE;
    $verMas.hidden = !hayMas;
  } catch (e) {
    /* Si falta el índice compuesto (visible + fecha), Firestore rechaza la
       consulta con failed-precondition. Plan B: traer solo con el filtro
       de visibilidad y ordenar aquí. */
    if (!modoLocal && e && e.code === 'failed-precondition') {
      console.warn('Falta el índice compuesto en Firestore; usando orden local.', e.message);
      try {
        const snap = await getDocs(query(col, where('visible', '==', true), limit(120)));
        docsLocales = snap.docs.slice().sort((a, b) => {
          const fa = a.data().fecha, fb = b.data().fecha;
          return (fb ? fb.toMillis() : 0) - (fa ? fa.toMillis() : 0);
        });
        modoLocal = true;
        await cargarPagina();
        return;
      } catch (e2) {
        console.error(e2);
        mostrarError();
      }
    } else {
      console.error(e);
      mostrarError();
    }
  } finally {
    $verMas.disabled = false;
  }
}

$verMas.addEventListener('click', cargarPagina);
cargarPagina();

/* ---------- Selector de estrellas ---------- */

let estrellasSel = 0;
const botonesEstrella = Array.from($estrellas.querySelectorAll('button'));

function pintarEstrellas() {
  botonesEstrella.forEach(b => {
    const v = Number(b.dataset.valor);
    b.classList.toggle('activa', v <= estrellasSel);
    b.setAttribute('aria-pressed', v <= estrellasSel ? 'true' : 'false');
  });
}

botonesEstrella.forEach(b => {
  b.addEventListener('click', () => {
    const v = Number(b.dataset.valor);
    estrellasSel = (v === estrellasSel) ? 0 : v;  // tocar la misma la des-selecciona
    pintarEstrellas();
  });
});
pintarEstrellas();

/* ---------- Contador de caracteres ---------- */

function actualizarContador() {
  $contador.textContent = $mensaje.value.length + ' / 1200';
}
$mensaje.addEventListener('input', actualizarContador);
actualizarContador();

/* ---------- Envío ---------- */

function ponerError(el, campoInput, texto) {
  el.textContent = texto;
  el.hidden = false;
  campoInput.classList.add('con-error');
}

function limpiarErrores() {
  [$errNombre, $errMensaje].forEach(el => { el.hidden = true; el.textContent = ''; });
  [$nombre, $mensaje].forEach(el => el.classList.remove('con-error'));
}

$form.addEventListener('submit', async ev => {
  ev.preventDefault();
  limpiarErrores();
  $confirmacion.hidden = true;

  const nombre = $nombre.value.trim();
  const mensaje = $mensaje.value.trim();
  let valido = true;

  if (nombre.length < 2) {
    ponerError($errNombre, $nombre, 'Escribe tu nombre, por favor.');
    valido = false;
  } else if (nombre.length > 79) {
    ponerError($errNombre, $nombre, 'El nombre es demasiado largo (máximo 79 caracteres).');
    valido = false;
  }

  if (mensaje.length < 16) {
    ponerError($errMensaje, $mensaje, 'El mensaje es muy corto: escribe al menos 16 caracteres.');
    valido = false;
  } else if (mensaje.length > 1199) {
    ponerError($errMensaje, $mensaje, 'El mensaje es demasiado largo (máximo 1199 caracteres).');
    valido = false;
  }

  if (!valido) return;

  $enviar.disabled = true;
  $enviar.textContent = 'Publicando…';

  try {
    await addDoc(col, {
      nombre: nombre,
      mensaje: mensaje,
      estrellas: Math.trunc(estrellasSel),
      fecha: serverTimestamp(),
      visible: true
    });

    /* Tarjeta nueva al inicio, sin recargar. */
    const ahora = new Date();
    const tarjeta = crearTarjeta({
      nombre: nombre,
      mensaje: mensaje,
      estrellas: estrellasSel,
      fechaTexto: MESES[ahora.getMonth()] + ' ' + ahora.getFullYear()
    });
    tarjeta.classList.add('agr-nueva');
    $lista.prepend(tarjeta);
    $lista.hidden = false;
    $estado.hidden = true;

    $confirmacion.hidden = false;
    $form.reset();
    estrellasSel = 0;
    pintarEstrellas();
    actualizarContador();
  } catch (e) {
    console.error(e);
    ponerError($errMensaje, $mensaje,
      'No pudimos publicar tu mensaje. Revisa tu conexión e inténtalo de nuevo.');
  } finally {
    $enviar.disabled = false;
    $enviar.textContent = 'Publicar agradecimiento';
  }
});
