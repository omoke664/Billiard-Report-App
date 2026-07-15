// next.config.js
const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development', // Disable PWA in dev for faster reloading
    register: true,
    skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    allowedDevOrigins: ['192.168.0.18'],

    // Explicitly keep webpack config for next-pwa compatibility
    webpack: (config) => {
        return config;
    },

    // Silence the Turbopack warning by providing an empty config
    // (next-pwa requires webpack, so this ensures no conflicts)
    turbopack: {},
};

module.exports = withPWA(nextConfig);