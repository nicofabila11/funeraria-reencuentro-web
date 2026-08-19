# Cómo moderar los agradecimientos del sitio

Los mensajes que las familias escriben en la sección "Agradecimientos" se
publican de inmediato en la página. Nadie puede editarlos ni borrarlos desde
el sitio. Si llega un mensaje que no corresponde, se oculta en un minuto
siguiendo estos pasos.

## 1. Entrar a la consola

1. Abre en el navegador: **https://console.firebase.google.com**
2. Inicia sesión con la cuenta de Google del proyecto.
3. Haz clic en el proyecto **reencuentro-9932f**.

## 2. Ver los mensajes

1. En el menú de la izquierda, busca **Compilación** y haz clic en
   **Firestore Database**.
2. En la lista del centro verás la colección **agradecimientos**.
   Haz clic en ella.
3. Cada fila es un mensaje. Al hacer clic en uno, a la derecha se muestran
   sus datos: **nombre** (quien escribió), **mensaje** (el texto),
   **estrellas** (la calificación) y **visible**.

## 3. Ocultar un mensaje

1. Haz clic en el mensaje que quieres ocultar.
2. En el panel de la derecha, busca el campo **visible**. Dirá `true`.
3. Pasa el mouse sobre esa línea y haz clic en el **lápiz** (editar).
4. Cambia el valor de `true` a **`false`** (con el selector desplegable).
5. Haz clic en **Actualizar**.

Listo: el mensaje desaparece del sitio de inmediato (al recargar la página).
No se borra — queda guardado por si quieres volver a mostrarlo cambiando
`visible` de nuevo a `true`.

## Consejos

- **No borres documentos** (botón de basurero) a menos que estés seguro:
  ocultar con `visible: false` es reversible, borrar no.
- No edites el texto de los mensajes: son palabras de las familias.
- Si algo se ve raro en el sitio después de un cambio, recarga la página
  con Ctrl+Shift+R (o Cmd+Shift+R en Mac).
