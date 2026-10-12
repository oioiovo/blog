/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'

const nextConfig = {
  // 静态导出：pnpm build 后生成 out/ 目录，可直接部署到 GitHub Pages
  output: 'export',
  // 项目站挂在 https://oioiovo.github.io/blog/ 下
  basePath: isProd ? '/blog' : '',
  // 生成 out/posts/xxx/index.html，兼容 GitHub Pages 的目录路由
  trailingSlash: true,
  // 静态导出不支持 next/image 优化
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
}

export default nextConfig
