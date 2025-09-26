/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    // Core Ant Design packages
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    // Unscoped rc-* packages
    'rc-util',
    'rc-picker',
    'rc-tree',
    'rc-table',
    'rc-input',
    'rc-pagination',
    'rc-select',
    'rc-textarea',
    'rc-dropdown',
    'rc-menu',
    'rc-notification',
    // Scoped @rc-component/* packages
    '@rc-component/util',    // Current error
    '@rc-component/portal',  // Common in Ant Design for modals/popovers
    '@rc-component/context', // Context utilities
    '@rc-component/tour',    // For tours/tooltips
  ],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(nextConfig);