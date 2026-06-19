// OAuth handler: redirige al login de GitHub
exports.handler = async (event) => {
  const host = event.headers['x-forwarded-host'] || event.headers.host;
  const redirectUri = `https://${host}/.netlify/functions/callback`;

  const params = new URLSearchParams({
    client_id: process.env.OAUTH_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: 'repo,user',
    state: Math.random().toString(36).substring(2, 15)
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
      'Cache-Control': 'no-store'
    },
    body: ''
  };
};
