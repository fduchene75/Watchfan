/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    // Polyfills pour les bibliothèques Web3 côté client
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

    // Exclure les modules problématiques du bundling côté serveur
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@walletconnect/ethereum-provider': 'commonjs @walletconnect/ethereum-provider',
        '@walletconnect/core': 'commonjs @walletconnect/core',
      });
    }

    return config;
  },

  // Configuration pour éviter les erreurs de chunks
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', 'wagmi', 'viem'],
  },
};

export default nextConfig;