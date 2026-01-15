import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { FooterWrapper } from "@/components/layout/FooterWrapper";
import { AppProviders } from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "QuinerApp - Gestão de Sorveteria",
  description: "Sistema completo de gestão para delivery de sorveteria",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Polyfill imediato para 'browser' - executa antes de tudo
              (function(){'use strict';try{if(typeof globalThis!=='undefined'&&typeof globalThis.browser==='undefined'){globalThis.browser={}}if(typeof global!=='undefined'&&typeof global.browser==='undefined'){global.browser={}}if(typeof window!=='undefined'&&typeof window.browser==='undefined'){window.browser={}}if(typeof self!=='undefined'&&typeof self.browser==='undefined'){self.browser={}}}catch(e){}})();
              // Suprime erros de extensões imediatamente
              (function(){'use strict';if(typeof window==='undefined')return;var extFiles=['myContent.js','pagehelper.js','content.js','injected.js','extension://','chrome-extension://','moz-extension://'];function isExtErr(m,f){if(!m)return false;var ms=String(m).toLowerCase(),hasBr=ms.indexOf('browser is not defined')!==-1||(ms.indexOf('browser')!==-1&&ms.indexOf('not defined')!==-1);if(!hasBr)return false;if(f){var fs=String(f).toLowerCase();return extFiles.some(function(x){return fs.indexOf(x.toLowerCase())!==-1});}return extFiles.some(function(x){return ms.indexOf(x.toLowerCase())!==-1});}var origErr=console.error,origWarn=console.warn;console.error=function(){var a=Array.prototype.slice.call(arguments),m=a.join(' ');if(!isExtErr(m))origErr.apply(console,a);};console.warn=function(){var a=Array.prototype.slice.call(arguments),m=a.join(' ');if(!isExtErr(m))origWarn.apply(console,a);};var eh=function(e){var f=e.filename||e.source||'',m=e.message||e.error?.message||'';if(isExtErr(m,f)){e.preventDefault();e.stopPropagation();return false;}};window.addEventListener('error',eh,true);window.addEventListener('error',eh,false);window.addEventListener('unhandledrejection',function(e){if(e.reason&&isExtErr(String(e.reason))){e.preventDefault();}});var origOnErr=window.onerror;window.onerror=function(m,s,l,c,err){if(isExtErr(m,s))return true;if(origOnErr)return origOnErr.apply(window,arguments);return false;};})();
            `,
          }}
        />
        <Script
          id="browser-polyfill"
          strategy="beforeInteractive"
          src="/browser-polyfill.js"
        />
        <Script
          id="suppress-extension-errors"
          strategy="beforeInteractive"
          src="/suppress-extension-errors.js"
        />
        <AppProviders>
          <HeaderWrapper />
          <main className="flex-grow">{children}</main>
          <FooterWrapper />
        </AppProviders>
      </body>
    </html>
  );
}
