// OAuth callback: intercambia el code por un token y lo manda al panel admin (Decap/Sveltia format)
exports.handler = async (event) => {
  const params = new URLSearchParams(event.queryStringParameters || {});
  const code = params.get('code');

  if (!code) {
    return { statusCode: 400, body: 'Missing code' };
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code
      })
    });

    const data = await res.json();

    if (!data.access_token) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Auth failed: ' + JSON.stringify(data)
      };
    }

    const payload = JSON.stringify({ token: data.access_token, provider: 'github' });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Login OK</title></head>
<body style="font-family:system-ui;padding:40px;text-align:center">
<h2>Autorizado ✓</h2>
<p>Cerrando ventana…</p>
<script>
(function() {
  function send(e) {
    if (!window.opener) return;
    var msg = 'authorization:github:success:' + ${JSON.stringify(payload)};
    window.opener.postMessage(msg, e && e.origin ? e.origin : '*');
  }
  window.addEventListener('message', function(e) {
    if (e.data === 'authorizing:github') send(e);
  }, false);
  if (window.opener) {
    window.opener.postMessage('authorizing:github', '*');
    setTimeout(function(){ send({origin:'*'}); }, 100);
    setTimeout(function(){ window.close(); }, 500);
  }
})();
</script>
</body></html>`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' },
      body: html
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Error: ' + err.message
    };
  }
};
