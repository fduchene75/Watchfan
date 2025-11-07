/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuration for external images (IPFS gateways)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.pinata.cloud',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'dweb.link',
        pathname: '/ipfs/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/ipfs/**',
      },
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  webpack: (config, { isServer }) => {
    // Client-side polyfills disabled (modern approach)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        net: false,
        tls: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
      };
    }

    // Exclude problematic modules from server-side bundling
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@walletconnect/ethereum-provider',
        '@walletconnect/core',
        'viem',
        'wagmi',
      ];
    }

    return config;
  },

  compress: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/ipfs/:cid',
        destination: 'https://gateway.pinata.cloud/ipfs/:cid',
      },
    ];
  },

  publicRuntimeConfig: {
    NEXT_PUBLIC_PINATA_GATEWAY: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  },

  compiler: {
    reactRemoveProperties: true,
    removeConsole: process.env.NODE_ENV === 'production',
  },

  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV !== 'production',
  },

  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV !== 'production',
  },

  // Optimize package imports
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
};

export default nextConfig;