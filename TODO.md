# Portfolio Project TODO List

## Project: Next.js Senior Full Stack Developer Portfolio

## Project Purpose

This is a comprehensive personal portfolio website for a senior full-stack developer, showcasing advanced technical skills and real-world applications. The portfolio demonstrates expertise in:

- **Real-time Systems**: WebSocket-based load balancing, traffic management, and data streaming
- **WebAssembly**: 3D rendering acceleration, video encoding/processing
- **AI/ML Integration**: ONNX Runtime Web for browser-based ML inference, AI agents (Gemini & GPT)
- **Cloud Services**: AWS, Azure, and Vercel integrations
- **Modern Web Technologies**: Next.js 14, React, TypeScript, Bulma CSS
- **Advanced Features**: WebRTC, Web3, GraphQL, CRDT, performance monitoring

The goal is to create an impressive, interactive portfolio that not only lists skills and projects but actively demonstrates them through working demos and real-time applications.

## Requirements

### Technical Requirements

1. **Framework & Language**
   - Next.js 14+ with App Router
   - TypeScript 5+
   - Server Components and Server Actions
   - Edge Functions support

2. **Styling**
   - **CRITICAL**: Use ONLY Bulma CSS framework
   - NO custom CSS classes or styles
   - NO overriding Bulma's default styles
   - Only use Bulma's native classes and components
   - Minimal inline styles ONLY for dynamic calculations (e.g., transforms, z-index)

3. **Core Technologies**
   - React 19+ with hooks and modern patterns
   - Framer Motion for animations
   - Three.js + React Three Fiber for 3D graphics
   - D3.js for data visualization
   - WebAssembly for performance-critical operations
   - ONNX Runtime Web for ML inference
   - WebSocket for real-time communication

4. **Cloud Services Integration**
   - AWS: S3, Lambda, API Gateway, CloudWatch, DynamoDB
   - Azure: Blob Storage, Functions, Cognitive Services, AI Services
   - Vercel: Edge Functions, Analytics, Serverless Functions, KV

5. **AI/ML Integration**
   - Google Gemini API for AI agents
   - OpenAI GPT API for AI agents
   - ONNX Runtime Web for browser-based ML
   - Support for WebGPU/WebNN acceleration

6. **Advanced Features**
   - WebRTC for real-time collaboration
   - Web3/Ethereum integration
   - GraphQL with Apollo
   - CRDT for conflict-free data synchronization
   - Performance monitoring and analytics

### Functional Requirements

1. **Homepage**
   - Hero section with 3D interactive background
   - Typing animation for role display
   - Smooth scrolling navigation
   - Demo showcase cards

2. **Interactive Demos**
   - Real-time network traffic visualization
   - Big data handling with virtual scrolling
   - WebAssembly 3D rendering
   - WebAssembly video processing
   - ONNX Runtime AI inference
   - AI agent chat interfaces

3. **Project Portfolio**
   - Project cards with descriptions
   - Technology stack tags
   - GitHub and demo links
   - AI-generated project descriptions

4. **Skills Page**
   - Skill radar chart
   - Technology icons
   - Experience timeline
   - Skill proficiency visualization

5. **Contact Form**
   - Form validation
   - AI-assisted responses
   - Email integration via cloud services
   - Spam protection

### Non-Functional Requirements

1. **Performance**
   - Fast initial page load (< 3s)
   - Optimized images and assets
   - Code splitting and lazy loading
   - PWA support for offline access

2. **Accessibility**
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader optimization
   - High contrast mode support

3. **SEO**
   - Semantic HTML
   - Meta tags optimization
   - Sitemap generation
   - Open Graph tags

4. **Security**
   - OAuth 2.0 authentication
   - JWT token management
   - CSP headers
   - XSS/CSRF protection

5. **Browser Support**
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Progressive enhancement
   - Graceful degradation

### Development Requirements

1. **Package Manager**: Use pnpm (not npm)
2. **Version Control**: Git with proper commit messages
3. **Code Quality**: ESLint, Prettier, TypeScript strict mode
4. **Testing**: Unit tests, E2E tests with Playwright
5. **Deployment**: Vercel platform
6. **Documentation**: README, DEVELOPMENT.md, inline code comments
7. **Browser Testing**: **REQUIRED** - After completing each task, test in browser to ensure no console errors or warnings
8. **Git Workflow**: **REQUIRED** - After completing each task and testing, commit changes and push to GitHub

### Design Requirements

1. **Responsive Design**: Mobile-first approach, works on all screen sizes
2. **Dark Mode**: Theme toggle with system preference detection
3. **Modern UI**: Clean, professional, and visually appealing
4. **Interactive Elements**: Smooth animations and transitions
5. **User Experience**: Intuitive navigation, clear call-to-actions

### Completed Tasks ✅

- [x] 项目初始化 - Next.js 14 项目创建，TypeScript、Bulma CSS 配置


### In Progress 🚧
- [ ] 基础布局和导航 - 响应式导航栏，主题切换，平滑滚动
- [ ] 首页 Hero Section - 3D 背景，打字动画效果
- [ ] 实时网络流量演示 - WebSocket + D3.js 可视化
- [ ] 大数据处理演示 - 虚拟滚动，流式数据加载
- [ ] WebAssembly 3D 演示 - Three.js + WASM 加速
- [ ] WebAssembly 视频编码演示 - FFmpeg.wasm 视频处理

### Pending Tasks 📋

#### Core Demos
- [ ] ONNX Runtime Web AI 演示
  - [ ] ONNX Runtime Web 集成
  - [ ] 模型加载和推理
  - [ ] WebGPU/WebNN 加速配置
  - [ ] 实时推理演示
  - [ ] 性能对比可视化

- [ ] AI Agent 集成
  - [ ] Gemini API 集成
  - [ ] OpenAI API 集成
  - [ ] 流式响应处理
  - [ ] 多模型对比界面
  - [ ] 智能助手功能实现

#### Cloud Services Integration
- [ ] AWS 集成
  - [ ] S3 文件上传/下载
  - [ ] Lambda 函数调用
  - [ ] API Gateway 集成
  - [ ] CloudWatch 监控数据
  - [ ] DynamoDB 演示

- [ ] Azure 集成
  - [ ] Blob Storage 操作
  - [ ] Azure Functions 调用
  - [ ] Cognitive Services API 演示
  - [ ] Azure AI Services 集成

- [ ] Vercel 集成
  - [ ] Edge Functions 演示
  - [ ] Analytics 数据展示
  - [ ] Serverless Functions
  - [ ] Vercel KV 缓存演示

#### Advanced Features
- [ ] WebRTC 实时协作
  - [ ] WebRTC 连接建立
  - [ ] 视频通话功能
  - [ ] 共享白板
  - [ ] 代码协作编辑器

- [ ] Web3 集成
  - [ ] MetaMask 连接
  - [ ] 智能合约交互
  - [ ] NFT 展示

- [ ] GraphQL 集成
  - [ ] Apollo Server 设置
  - [ ] Apollo Client 配置
  - [ ] 实时订阅

- [ ] CRDT 实时同步
  - [ ] Yjs 集成
  - [ ] 冲突解决
  - [ ] 离线支持

#### Pages
- [ ] 项目作品集页面
  - [ ] 项目数据管理
  - [ ] 卡片布局
  - [ ] 详情模态框
  - [ ] AI 生成描述集成

- [ ] 技能展示页面
  - [ ] 技能雷达图
  - [ ] 技术栈图标
  - [ ] 经验年限展示
  - [ ] 技能熟练度可视化

- [ ] 联系表单页面
  - [ ] 表单验证
  - [ ] AI 辅助回复
  - [ ] 邮件发送
  - [ ] 防垃圾邮件保护

#### Advanced Features (Continued)
- [ ] 高级动画
  - [ ] Lottie 动画
  - [ ] GSAP 动画
  - [ ] 粒子系统

- [ ] 安全功能
  - [ ] OAuth 集成
  - [ ] JWT 实现
  - [ ] 安全头配置

- [ ] 性能监控
  - [ ] 性能指标收集
  - [ ] Sentry 集成
  - [ ] 监控仪表板

- [ ] 国际化与无障碍
  - [ ] i18n 配置
  - [ ] A11y 优化

#### Showcase Features
- [ ] 代码雨效果
- [ ] 音乐可视化
- [ ] 手势控制
- [ ] 语音交互
- [ ] 实时协作游戏
- [ ] 代码编辑器集成
- [ ] 实时数据流可视化
- [ ] 3D 作品集展示

#### Testing & Deployment
- [ ] 单元测试
- [ ] E2E 测试
- [ ] 性能优化
- [ ] SEO 优化
- [ ] Vercel 部署配置
- [ ] 环境变量设置
- [ ] PWA 配置

## Development Rules

⚠️ **CRITICAL: Use ONLY Bulma CSS - No Custom CSS**
- Only use Bulma's native classes and components
- Do NOT add custom CSS classes or styles
- Do NOT override Bulma's default styles
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guidelines

## Package Manager

- Use **pnpm** for all package management operations

## Git Configuration

- Email: zxcwqer9l@gmail.com
- Name: xiaooye

