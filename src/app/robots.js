export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kmusicerdas.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/pending'], // Disallow crawling internal user panels
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
