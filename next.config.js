/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suprimir warnings de atributos de extensões do navegador
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.tecsoft.ind.br',
      },
      {
        protocol: 'https',
        hostname: 'tecsoft.ind.br',
      },
      {
        protocol: 'https',
        hostname: 'youvnaepznqfbpdacibs.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig

