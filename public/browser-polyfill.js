// Polyfill para 'browser' usado por extensões do navegador
// Este script deve ser carregado o mais cedo possível
(function() {
  'use strict';
  
  // Função para definir browser em todos os contextos usando defineProperty
  function defineBrowser() {
    try {
      var browserObj = {};
      
      // globalThis (ES2020+) - usa defineProperty para garantir que seja definido antes de qualquer acesso
      if (typeof globalThis !== 'undefined') {
        try {
          Object.defineProperty(globalThis, 'browser', {
            value: browserObj,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch(e) {
          // Se defineProperty falhar, tenta atribuição direta
          if (typeof globalThis.browser === 'undefined') {
            globalThis.browser = browserObj;
          }
        }
      }
      
      // global (Node.js)
      if (typeof global !== 'undefined') {
        try {
          Object.defineProperty(global, 'browser', {
            value: browserObj,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch(e) {
          if (typeof global.browser === 'undefined') {
            global.browser = browserObj;
          }
        }
      }
      
      // window (Browser)
      if (typeof window !== 'undefined') {
        try {
          Object.defineProperty(window, 'browser', {
            value: browserObj,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch(e) {
          if (typeof window.browser === 'undefined') {
            window.browser = browserObj;
          }
        }
      }
      
      // self (Web Workers)
      if (typeof self !== 'undefined') {
        try {
          Object.defineProperty(self, 'browser', {
            value: browserObj,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch(e) {
          if (typeof self.browser === 'undefined') {
            self.browser = browserObj;
          }
        }
      }
    } catch(e) {
      // Silenciosamente ignora erros durante SSR
    }
  }
  
  // Define imediatamente
  defineBrowser();
  
  // Intercepta erros de ReferenceError relacionados a 'browser'
  if (typeof window !== 'undefined' && window.addEventListener) {
    var originalErrorHandler = window.onerror;
    window.addEventListener('error', function(event) {
      if (event.message && (event.message.indexOf('browser is not defined') !== -1 || 
                           event.message.indexOf('browser') !== -1 && event.message.indexOf('not defined') !== -1)) {
        defineBrowser();
        // Não previne o erro, mas garante que browser existe para próximas tentativas
        if (originalErrorHandler) {
          return originalErrorHandler.apply(window, arguments);
        }
      }
    }, true);
    
    // Também intercepta erros não capturados
    window.addEventListener('unhandledrejection', function(event) {
      if (event.reason) {
        var reasonStr = String(event.reason);
        if (reasonStr.indexOf('browser is not defined') !== -1) {
          defineBrowser();
        }
      }
    });
  }
  
  // Tenta definir novamente após um pequeno delay para pegar extensões que carregam depois
  if (typeof window !== 'undefined') {
    setTimeout(defineBrowser, 0);
    setTimeout(defineBrowser, 10);
    setTimeout(defineBrowser, 50);
  }
})();

