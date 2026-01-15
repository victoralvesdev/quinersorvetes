/**
 * Polyfill para a variável 'browser' usada por extensões do navegador
 * Isso previne erros quando extensões tentam acessar 'browser' durante SSR
 */

// #region agent log
if (typeof window !== 'undefined') {
  fetch('http://127.0.0.1:7243/ingest/a6672625-487f-416c-8592-f7e71a1c4988', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'lib/polyfills/browser.ts:8',
      message: 'Polyfill browser - window exists',
      data: { hasWindow: true, userAgent: navigator?.userAgent?.substring(0, 50) },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'A'
    })
  }).catch(() => {});
}
// #endregion

// Define 'browser' globalmente se não existir
if (typeof globalThis !== 'undefined') {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a6672625-487f-416c-8592-f7e71a1c4988', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'lib/polyfills/browser.ts:20',
      message: 'Polyfill browser - setting globalThis.browser',
      data: { hasGlobalThis: true, browserExists: typeof (globalThis as any).browser !== 'undefined' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'B'
    })
  }).catch(() => {});
  // #endregion

  if (typeof (globalThis as any).browser === 'undefined') {
    (globalThis as any).browser = typeof window !== 'undefined' 
      ? (window as any).browser || {} 
      : {};
  }
}

// Também define no escopo global se estiver no Node.js
if (typeof global !== 'undefined') {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/a6672625-487f-416c-8592-f7e71a1c4988', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'lib/polyfills/browser.ts:35',
      message: 'Polyfill browser - setting global.browser',
      data: { hasGlobal: true, browserExists: typeof (global as any).browser !== 'undefined' },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C'
    })
  }).catch(() => {});
  // #endregion

  if (typeof (global as any).browser === 'undefined') {
    (global as any).browser = {};
  }
}

