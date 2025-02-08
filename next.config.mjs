/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    WEB3_AUTH: process.env.WEB3_AUTH,

    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  },
};

export default nextConfig;
