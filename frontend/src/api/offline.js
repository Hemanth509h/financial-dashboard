import axios from 'axios';

/**
 * Offline-first request layer.
 *
 * - GETs always try the network first; on network failure they return the
 *   last cached response so the UI keeps working.
 * - Mutations (POST/PATCH/DELETE) optimistically update local cache so the
 *   user sees their change immediately. If the request fails because the
 *   backend is unreachable, the operation is enqueued and replayed once the
 *   backend comes back online. Server-side errors (4xx/5xx) are never queued;
 *   they propagate to the caller so the UI can react.
 * - A periodic ping to /api/health (and the browser's online/offline events)
 *   flips an `online` flag and triggers queue flushing.
 */

const KEYS = {
  cache: 'gf:offline:cache:v1',
  queue: 'gf:offline:queue:v1',
};

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or private mode — silently ignore.
  }
};

const state = {
  online: true,
  cache: load(KEYS.cache, {}),
  queue: load(KEYS.queue, []),
  listeners: new Set(),
};

const persistCache = () => save(KEYS.cache, state.cache);
const persistQueue = () => save(KEYS.queue, state.queue);

const notify = () => {
  const snapshot = {
    online: state.online,
    queueLength: state.queue.length,
  };
  state.listeners.forEach((fn) => {
    try {
      fn(snapshot);
    } catch {
      // ignore
    }
  });
};

export function subscribeStatus(fn) {
  state.listeners.add(fn);
  fn({ online: state.online, queueLength: state.queue.length });
  return () => state.listeners.delete(fn);
}

const setOnline = (value) => {
  if (state.online === value) return;
  state.online = value;
  notify();
  if (value) flushQueue();
};

const tempId = (prefix = 'tmp') =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

const getCache = (url) => state.cache[url];
const setCache = (url, data) => {
  state.cache[url] = data;
  persistCache();
};
const dropCache = (url) => {
  delete state.cache[url];
  persistCache();
};

/**
 * Apply a mutation to the in-memory caches so reads see local changes
 * immediately. Returns the synthesized response body the UI should receive.
 */
function applyMutation(op) {
  // /api/work-logs
  if (op.url === '/api/work-logs' && op.method === 'post') {
    const list = getCache('/api/work-logs') || [];
    const item = {
      _id: op.tempId,
      amountPaid: 0,
      status: op.data?.status || 'Unpaid',
      ...op.data,
      _pending: true,
    };
    setCache('/api/work-logs', [item, ...list]);
    return item;
  }
  const wlOne = op.url.match(/^\/api\/work-logs\/(.+)$/);
  if (wlOne) {
    const id = wlOne[1];
    const list = getCache('/api/work-logs') || [];
    if (op.method === 'patch') {
      const next = list.map((x) => (x._id === id ? { ...x, ...op.data, _pending: true } : x));
      setCache('/api/work-logs', next);
      return next.find((x) => x._id === id) || { _id: id };
    }
    if (op.method === 'delete') {
      setCache('/api/work-logs', list.filter((x) => x._id !== id));
      return { _id: id };
    }
  }

  // /api/loans
  if (op.url === '/api/loans' && op.method === 'post') {
    const list = getCache('/api/loans') || [];
    const item = {
      _id: op.tempId,
      amountPaid: 0,
      status: 'Active',
      ...op.data,
      _pending: true,
    };
    setCache('/api/loans', [item, ...list]);
    return item;
  }
  const lnOne = op.url.match(/^\/api\/loans\/([^/]+)$/);
  if (lnOne) {
    const id = lnOne[1];
    const list = getCache('/api/loans') || [];
    if (op.method === 'patch') {
      const next = list.map((x) => (x._id === id ? { ...x, ...op.data, _pending: true } : x));
      setCache('/api/loans', next);
      return next.find((x) => x._id === id) || { _id: id };
    }
    if (op.method === 'delete') {
      setCache('/api/loans', list.filter((x) => x._id !== id));
      dropCache(`/api/loans/${id}/repayments`);
      return { _id: id };
    }
  }

  // /api/loans/:id/repayments
  const repList = op.url.match(/^\/api\/loans\/([^/]+)\/repayments$/);
  if (repList && op.method === 'post') {
    const loanId = repList[1];
    const cacheKey = `/api/loans/${loanId}/repayments`;
    const list = getCache(cacheKey) || [];
    const item = {
      _id: op.tempId,
      loanId,
      status: 'Success',
      ...op.data,
      _pending: true,
    };
    setCache(cacheKey, [item, ...list]);

    const loans = getCache('/api/loans') || [];
    const delta = Number(op.data?.amount || 0);
    setCache(
      '/api/loans',
      loans.map((l) =>
        l._id === loanId ? { ...l, amountPaid: (l.amountPaid || 0) + delta } : l,
      ),
    );
    return item;
  }
  const repOne = op.url.match(/^\/api\/loans\/([^/]+)\/repayments\/(.+)$/);
  if (repOne) {
    const loanId = repOne[1];
    const repId = repOne[2];
    const cacheKey = `/api/loans/${loanId}/repayments`;
    const list = getCache(cacheKey) || [];
    if (op.method === 'patch') {
      const old = list.find((x) => x._id === repId);
      const oldAmount = Number(old?.amount || 0);
      const next = list.map((x) =>
        x._id === repId ? { ...x, ...op.data, _pending: true } : x,
      );
      setCache(cacheKey, next);
      const newAmount = Number(op.data?.amount ?? oldAmount);
      const delta = newAmount - oldAmount;
      const loans = getCache('/api/loans') || [];
      setCache(
        '/api/loans',
        loans.map((l) =>
          l._id === loanId ? { ...l, amountPaid: (l.amountPaid || 0) + delta } : l,
        ),
      );
      return next.find((x) => x._id === repId) || { _id: repId };
    }
    if (op.method === 'delete') {
      const old = list.find((x) => x._id === repId);
      const oldAmount = Number(old?.amount || 0);
      setCache(
        cacheKey,
        list.filter((x) => x._id !== repId),
      );
      const loans = getCache('/api/loans') || [];
      setCache(
        '/api/loans',
        loans.map((l) =>
          l._id === loanId
            ? { ...l, amountPaid: Math.max(0, (l.amountPaid || 0) - oldAmount) }
            : l,
        ),
      );
      return { _id: repId };
    }
  }

  return null;
}

/**
 * After the server creates a record we generated a temp id for, swap that
 * temp id for the real one across all caches and any pending operations
 * (e.g. a queued repayment that referenced the temp loan id).
 */
function replaceTempId(oldId, newId) {
  state.queue = state.queue.map((op) => ({
    ...op,
    url: op.url.split(oldId).join(newId),
    tempId: op.tempId === oldId ? newId : op.tempId,
  }));

  for (const key of Object.keys(state.cache)) {
    const value = state.cache[key];
    if (Array.isArray(value)) {
      state.cache[key] = value.map((x) =>
        x && x._id === oldId ? { ...x, _id: newId } : x,
      );
    }
    if (key.includes(oldId)) {
      const newKey = key.split(oldId).join(newId);
      state.cache[newKey] = state.cache[key];
      delete state.cache[key];
    }
  }
  persistCache();
  persistQueue();
}

const enqueue = (op) => {
  state.queue.push(op);
  persistQueue();
  notify();
};

const dequeue = (opId) => {
  state.queue = state.queue.filter((x) => x.id !== opId);
  persistQueue();
  notify();
};

let flushing = false;
async function flushQueue() {
  if (flushing || state.queue.length === 0) return;
  flushing = true;
  try {
    while (state.queue.length > 0) {
      const op = state.queue[0];
      try {
        const res = await axios.request({
          method: op.method,
          url: op.url,
          data: op.data,
        });
        if (op.tempId && res.data && res.data._id && res.data._id !== op.tempId) {
          replaceTempId(op.tempId, res.data._id);
        }
        dequeue(op.id);
      } catch (err) {
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          // Server rejected this operation; it will never succeed — drop it.
          console.warn('Dropping rejected offline op', op, err.response.status);
          dequeue(op.id);
          continue;
        }
        // Network or 5xx error: stop and try again later.
        if (!err.response) setOnline(false);
        break;
      }
    }
    notify();
  } finally {
    flushing = false;
  }
}

const isMutation = (m) => ['post', 'patch', 'put', 'delete'].includes(m);

export async function request(config) {
  const method = (config.method || 'get').toLowerCase();
  const url = config.url;

  if (method === 'get') {
    try {
      const res = await axios.request(config);
      setCache(url, res.data);
      setOnline(true);
      return res;
    } catch (err) {
      if (err.response) {
        // Server responded with an error — not "offline".
        throw err;
      }
      setOnline(false);
      const cached = getCache(url);
      if (cached !== undefined) {
        return {
          data: cached,
          status: 200,
          statusText: 'OK (offline cache)',
          headers: {},
          config,
          fromCache: true,
        };
      }
      throw err;
    }
  }

  if (isMutation(method)) {
    const opId = tempId('op');
    const op = {
      id: opId,
      method,
      url,
      data: config.data,
    };
    if (method === 'post') op.tempId = tempId('rec');

    const optimistic = applyMutation(op);

    try {
      const res = await axios.request(config);
      setOnline(true);
      if (op.tempId && res.data && res.data._id && res.data._id !== op.tempId) {
        replaceTempId(op.tempId, res.data._id);
      }
      return res;
    } catch (err) {
      if (err.response) {
        // Real server error — propagate so the UI can show a message.
        throw err;
      }
      // Offline — queue and return optimistic result.
      setOnline(false);
      enqueue(op);
      return {
        data: optimistic || {},
        status: 200,
        statusText: 'OK (queued offline)',
        headers: {},
        config,
        offline: true,
      };
    }
  }

  return axios.request(config);
}

// --- Backend health monitor --------------------------------------------------

async function ping() {
  try {
    await axios.get('/api/health', { timeout: 5000 });
    setOnline(true);
    if (state.queue.length > 0) flushQueue();
  } catch (err) {
    if (!err.response) setOnline(false);
  }
}

if (typeof window !== 'undefined') {
  ping();
  setInterval(ping, 15000);
  window.addEventListener('online', ping);
  window.addEventListener('offline', () => setOnline(false));
  if (state.queue.length > 0) {
    setTimeout(flushQueue, 1000);
  }
}
