import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Gap-Mining', short_name: 'Gap-Mining', start_url: '/gaps', scope: '/', display: 'standalone',
    background_color: '#000000', theme_color: '#000000',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
