/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverComponentsExternalPackages: ["postgres", "bcryptjs"],
  },
};

export default nextConfig;
