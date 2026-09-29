// A single refresh request serves concurrent API failures. Tokens remain in memory.
export function configureSessionClient(client, { refreshRequest, onTokenChange = () => {}, onExpired = () => {}, apiOrigin }) {
  let token = null;
  let revision = 0;
  let refreshPromise = null;

  const isApiRequest = (config) => {
    try {
      const url = new URL(config.url, config.baseURL || apiOrigin);
      return url.origin === apiOrigin && url.pathname.startsWith('/api/');
    } catch { return false; }
  };
  const publishToken = (value) => { token = value; onTokenChange(value); };
  const setToken = (value) => { revision += 1; refreshPromise = null; publishToken(value); };
  const refresh = () => {
    if (refreshPromise) return refreshPromise;
    const startedAt = revision;
    const pending = Promise.resolve().then(refreshRequest).then((newToken) => {
      if (revision !== startedAt) throw new Error('Session changed while refreshing');
      if (!newToken) throw new Error('The server did not return a session token');
      publishToken(newToken);
      return newToken;
    }).catch((error) => {
      if (revision === startedAt && [401, 403].includes(error.response?.status)) {
        publishToken(null);
        onExpired();
      }
      throw error;
    }).finally(() => { if (refreshPromise === pending) refreshPromise = null; });
    refreshPromise = pending;
    return pending;
  };

  const requestId = client.interceptors.request.use((config) => {
    if (isApiRequest(config)) {
      config.withCredentials = true;
      config._sessionRevision ??= revision;
      if (config._sessionRevision !== revision) throw new Error('Session changed; request cancelled');
      if (token) config.headers.set('Authorization', `Bearer ${token}`);
      else config.headers.delete('Authorization');
    }
    return config;
  });
  const responseId = client.interceptors.response.use((response) => {
    if (isApiRequest(response.config) && response.config._sessionRevision !== revision) {
      throw new Error('Session changed; response discarded');
    }
    return response;
  }, async (error) => {
    const config = error.config;
    if (!config || !isApiRequest(config) || error.response?.status !== 401 || config._retry ||
        config._sessionRevision !== revision || /\/auth\/(login|logout|refresh|forgot-password|reset-password)(?:\?|$)/.test(config.url)) {
      throw error;
    }
    config._retry = true;
    // A slower request may fail after another request already refreshed the token.
    if (!token || config.headers.get('Authorization') === `Bearer ${token}`) await refresh();
    return client(config);
  });

  return {
    setToken, refresh,
    dispose() {
      client.interceptors.request.eject(requestId);
      client.interceptors.response.eject(responseId);
    },
  };
}

export function portalForRole(role) {
  return { SuperAdmin: '/superadmin', SchoolAdmin: '/admin', Teacher: '/teacher', Student: '/student' }[role] || '/unauthorized';
}
