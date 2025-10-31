import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  typedRoutes: true,
  transpilePackages: ['@chrono/ui', '@chrono/tokens', '@chrono/motion'],
  turbopack: {},
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/i,
      type: 'asset/source',
      generator: {
        filename: 'static/chunks/[hash][ext]',
      },
    });
    return config;
  },
};

export default withVanillaExtract(nextConfig);
