import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['typescript', 'twoslash'],
  reactStrictMode: true,
};

export default withMDX(config);
