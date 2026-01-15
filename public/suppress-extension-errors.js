// Suprime erros de extensões do navegador que tentam usar a API 'browser'
// Esses erros não afetam a funcionalidade da aplicação
(function() {
  'use strict';
  
  if (typeof window === 'undefined') return;
  
  // Lista de arquivos de extensões conhecidos que causam erros
  var extensionFiles = ['myContent.js', 'pagehelper.js', 'content.js', 'injected.js', 'extension://', 'chrome-extension://', 'moz-extension://'];
  
  // Função para verificar se um erro é de extensão
  function isExtensionError(message, filename) {
    if (!message) return false;
    
    var messageStr = String(message).toLowerCase();
    var hasBrowserError = messageStr.indexOf('browser is not defined') !== -1 || 
                         (messageStr.indexOf('browser') !== -1 && messageStr.indexOf('not defined') !== -1) ||
                         messageStr.indexOf('referenceerror') !== -1 && messageStr.indexOf('browser') !== -1;
    
    if (!hasBrowserError) return false;
    
    // Verifica se o erro vem de um arquivo de extensão
    if (filename) {
      var filenameStr = String(filename).toLowerCase();
      return extensionFiles.some(function(file) {
        return filenameStr.indexOf(file.toLowerCase()) !== -1;
      });
    }
    
    // Se não tem filename, verifica se a mensagem menciona arquivos de extensão conhecidos
    return extensionFiles.some(function(file) {
      return messageStr.indexOf(file.toLowerCase()) !== -1;
    });
  }
  
  // Intercepta erros antes que sejam logados no console
  var originalError = console.error;
  var originalWarn = console.warn;
  var originalLog = console.log;
  
  // Intercepta console.error
  console.error = function() {
    var args = Array.prototype.slice.call(arguments);
    var errorMessage = args.join(' ');
    var errorStack = args.find(function(arg) {
      return arg && typeof arg === 'object' && arg.stack;
    });
    
    var filename = errorStack && errorStack.stack ? 
                   (errorStack.stack.match(/\(([^)]+)\)/g) || []).join('') : 
                   null;
    
    if (!isExtensionError(errorMessage, filename)) {
      originalError.apply(console, args);
    }
  };
  
  // Intercepta console.warn
  console.warn = function() {
    var args = Array.prototype.slice.call(arguments);
    var errorMessage = args.join(' ');
    
    if (!isExtensionError(errorMessage)) {
      originalWarn.apply(console, args);
    }
  };
  
  // Intercepta erros não capturados relacionados a extensões (captura fase)
  var errorHandler = function(event) {
    var filename = event.filename || event.source || '';
    var message = event.message || event.error?.message || '';
    
    if (isExtensionError(message, filename)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  };
  
  // Adiciona listener em múltiplas fases
  window.addEventListener('error', errorHandler, true); // Captura
  window.addEventListener('error', errorHandler, false); // Bubbling
  
  // Intercepta rejeições não tratadas de extensões
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason) {
      var reasonStr = String(event.reason);
      var reasonMessage = event.reason?.message || reasonStr;
      
      if (isExtensionError(reasonMessage)) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  });
  
  // Também intercepta via onerror global
  var originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (isExtensionError(message, source)) {
      return true; // Suprime o erro
    }
    if (originalOnError) {
      return originalOnError.apply(window, arguments);
    }
    return false;
  };
})();

