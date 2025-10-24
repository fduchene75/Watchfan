/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuration for external images (IPFS via Pinata gateway)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        port: '',
        pathname: '/ipfs/**',
      },
    ],
  },
  
  webpack: (config, { isServer }) => {
    // Polyfills for Web3 libraries on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
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
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@walletconnect/ethereum-provider': 'commonjs @walletconnect/ethereum-provider',
        '@walletconnect/core': 'commonjs @walletconnect/core',
      });
    }

    return config;
  },

  // Configuration to avoid chunk errors
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
};

export default nextConfig;