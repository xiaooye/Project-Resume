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

## CTO Perspective: What to Expect from a Staff Level Full Stack System Architect

This portfolio should demonstrate capabilities that a CTO would expect from a **Staff Level Full Stack System Architect**:

### 1. **System Architecture & Design** (架构设计能力)
- **Scalability**: Design systems that handle millions of requests, demonstrate horizontal scaling strategies
- **Reliability**: Show fault tolerance, error handling, graceful degradation
- **Performance**: Optimize for sub-100ms response times, demonstrate performance monitoring and optimization
- **Security**: Implement security best practices, demonstrate understanding of OWASP Top 10
- **Cost Optimization**: Show cost analysis, resource optimization, multi-cloud strategies

### 2. **Production-Ready Systems** (生产级系统)
- **Monitoring & Observability**: Real-time monitoring, metrics (P95/P99), anomaly detection, SLA tracking
- **Load Balancing**: Demonstrate understanding of different algorithms (Round Robin, Least Connections, etc.)
- **Capacity Planning**: Show predictive analytics, auto-scaling strategies, resource planning
- **Incident Response**: Error tracking, alerting systems, recovery strategies
- **Data Pipeline**: Real-time data streaming, batch processing, ETL operations

### 3. **Technical Leadership** (技术领导力)
- **Code Quality**: Clean code, test coverage, documentation, code reviews
- **Best Practices**: Follow industry standards, design patterns, architectural patterns
- **Technology Selection**: Justify technology choices, demonstrate multi-technology expertise
- **Innovation**: Cutting-edge technologies (WebAssembly, WebGPU, AI/ML), experimental features

### 4. **Business Impact** (业务影响)
- **Cost Analysis**: Show cost optimization, ROI calculations, resource efficiency
- **User Experience**: WCAG 2.2 AAA compliance, responsive design, performance optimization
- **Time to Market**: Fast development cycles, CI/CD, automated testing
- **Scalability**: Systems that grow with business needs, multi-tenant architectures

### 5. **Full Stack Expertise** (全栈能力)
- **Frontend**: Modern frameworks, performance optimization, accessibility, responsive design
- **Backend**: API design, database optimization, caching strategies, microservices
- **DevOps**: CI/CD, infrastructure as code, monitoring, deployment strategies
- **Cloud**: Multi-cloud expertise (AWS, Azure, Vercel), serverless, edge computing

### 6. **Communication & Documentation** (沟通与文档)
- **Clear Documentation**: README, architecture diagrams, API documentation
- **Code Comments**: Inline comments, JSDoc, type definitions
- **User Experience**: Intuitive interfaces, clear error messages, helpful tooltips
- **Accessibility**: WCAG 2.2 AAA compliance, inclusive design

### Portfolio Features That Demonstrate These Capabilities:

1. **Real-time Network Traffic Monitor**: Shows system monitoring, load balancing, capacity planning, cost analysis
2. **Big Data Handling**: Demonstrates scalability, performance optimization, virtual scrolling
3. **WebAssembly Demos**: Shows performance engineering, cutting-edge technology adoption
4. **AI/ML Integration**: Demonstrates modern technology integration, real-world applications
5. **Cloud Services**: Multi-cloud expertise, cost optimization, serverless architecture
6. **Advanced Features**: WebRTC, Web3, GraphQL, CRDT - shows breadth of knowledge
7. **Responsive & Accessible**: WCAG 2.2 AAA compliance, mobile-first design
8. **Performance Optimized**: Core Web Vitals, bundle optimization, lazy loading
9. **Production Ready**: Error handling, monitoring, testing, CI/CD
10. **Well Documented**: Clear code, comments, documentation, architecture decisions

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

2. **Accessibility & Responsive Design**
   - **WCAG 2.2 AAA compliance** (highest level)
   - **Responsive Design**: Mobile-first approach, works perfectly on all screen sizes (320px to 4K)
   - **Mobile-Friendly**: Touch-optimized, swipe gestures, mobile navigation
   - Keyboard navigation support (full keyboard accessibility)
   - Screen reader optimization (ARIA labels, semantic HTML)
   - High contrast mode support
   - Focus indicators visible and clear
   - Color contrast ratios meet AAA standards (7:1 for normal text, 4.5:1 for large text)
   - Text alternatives for all images and icons
   - Skip navigation links
   - Error messages clearly identified and described

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

1. **Responsive Design**: 
   - Mobile-first approach, works on all screen sizes (320px to 4K)
   - Breakpoints: mobile (< 768px), tablet (768px - 1023px), desktop (1024px+)
   - Touch-optimized interactions for mobile devices
   - Swipe gestures for mobile navigation
   - Responsive images and media queries
2. **Dark Mode**: Theme toggle with system preference detection
3. **Modern UI**: Clean, professional, and visually appealing
4. **Eye-Friendly Apple's Liquid Glass Style** (护眼的苹果液态玻璃风格):
   - Glassmorphism effects with backdrop-filter blur
   - Soft, eye-friendly color palette with low saturation
   - Smooth transitions and subtle shadows
   - Layered depth with transparency
   - Reduced eye strain with optimized contrast ratios
   - Adaptive opacity based on content importance
5. **WebAssembly Animation Effects** (WebAssembly 动画效果):
   - High-performance animations using WebAssembly for complex calculations
   - Real-time particle systems and physics simulations
   - Smooth 60fps animations even with large datasets
   - Performance-optimized rendering pipelines
   - Fallback to JavaScript for unsupported browsers
   - Progressive enhancement approach
6. **Interactive Elements**: Smooth animations and transitions (respect prefers-reduced-motion)
7. **User Experience**: Intuitive navigation, clear call-to-actions
8. **WCAG 2.2 AAA Compliance**: 
   - Color contrast ratios: 7:1 for normal text, 4.5:1 for large text
   - All interactive elements keyboard accessible
   - Screen reader friendly with proper ARIA labels
   - Focus indicators visible on all focusable elements
   - Error messages clearly identified

### Completed Tasks ✅

- [x] 项目初始化 - Next.js 14 项目创建，TypeScript、Bulma CSS 配置
- [x] **全局样式和动画系统** - 护眼的苹果液态玻璃风格、WebAssembly 动画支持、性能优化
  - [x] 液态玻璃效果优化 - CSS 变量、层次深度、平滑过渡
  - [x] WebAssembly 动画支持 - GPU 加速、will-change 优化、性能工具类
  - [x] prefers-reduced-motion 支持 - 所有动画尊重用户偏好
  - [x] 响应式性能优化 - 移动端减少模糊效果、动画复杂度
  - [x] WCAG 2.2 AAA 焦点指示器 - 清晰的焦点样式
  - [x] 高对比度模式支持
- [x] **基础布局和导航** (Staff Level System Architecture Perspective)
  - [x] 响应式导航栏 - 移动端汉堡菜单，桌面端水平导航，WCAG 2.2 AAA 键盘导航
  - [x] 主题切换 - 系统偏好检测，持久化存储，平滑过渡动画
  - [x] 平滑滚动 - 锚点导航，滚动偏移计算（考虑固定导航栏）
  - [x] 移动端优化 - 触摸手势，滑动导航，响应式断点测试
  - [x] 无障碍优化 - ARIA 标签，键盘导航，屏幕阅读器支持，焦点管理
  - [x] 性能优化 - 导航栏滚动性能，减少重绘重排
- [x] **首页 Hero Section** (CTO Expectation: Showcase Technical Excellence)
  - [x] 3D 背景 - Three.js + React Three Fiber，性能优化（60fps），移动端降级
  - [x] 打字动画效果 - 流畅动画，可访问性（屏幕阅读器友好），减少动画选项支持
  - [x] 响应式设计 - 移动端 3D 场景优化，触摸交互
  - [x] 性能指标 - FPS 监控，内存使用，加载时间优化
  - [x] 无障碍 - 动画暂停选项，文本替代，键盘导航

#### Real-time Systems & Monitoring (CTO Critical: Production-Ready Monitoring)
- [x] **实时网络流量演示** (Staff Level: Enterprise-Grade Monitoring System)
  - [x] WebSocket/SSE 实时数据流 - 股票市场级别（50 服务器，200ms 更新）
  - [x] D3.js 可视化 - 请求分布，延迟趋势，区域分析
  - [x] 负载均衡算法可视化 - 4 种算法对比，实时请求路由
  - [x] CTO 级别功能 - P95/P99 延迟，SLA 监控，异常检测，容量规划
  - [x] 系统架构概览 - 技术栈展示，架构模式说明
  - [x] 性能优化建议 - 自动推荐，成本分析
  - [x] **响应式优化** - 移动端图表适配，触摸交互，简化视图
  - [x] **WCAG 2.2 AAA** - 图表数据表格化，颜色对比度，键盘导航
  - [x] **移动端优化** - 响应式图表，简化指标显示，触摸滚动优化

- [x] **大数据处理演示** (Staff Level: Scalability & Performance)
  - [x] 虚拟滚动 - 100 万条数据，性能优化
  - [x] 流式数据加载 - 按需加载，内存管理
  - [x] **响应式优化** - 移动端虚拟滚动优化，触摸滚动，简化 UI
  - [x] **WCAG 2.2 AAA** - 表格语义化，键盘导航，屏幕阅读器支持
  - [x] **性能监控** - 渲染时间，内存使用，FPS 监控
  - [x] **大数据分析** - 数据统计，过滤性能，搜索优化

- [x] **WebAssembly 3D 演示** (CTO Expectation: Performance Engineering)
  - [x] Three.js + WASM 加速 - 性能对比（WASM vs JS）
  - [x] 3D 渲染优化 - LOD，视锥剔除，实例化渲染
  - [x] 响应式 3D - 移动端性能优化，触摸控制
  - [x] 性能指标 - FPS，绘制调用，内存使用
  - [x] 无障碍 - 3D 场景描述，键盘控制，替代视图

- [x] **WebAssembly 视频编码演示** (Staff Level: Media Processing)
  - [x] FFmpeg.wasm 视频处理 - 编码/解码，格式转换
  - [x] 实时预览 - 视频流处理，进度显示
  - [x] 性能优化 - Web Workers，多线程处理
  - [x] 移动端支持 - 文件选择，触摸控制
  - [x] 无障碍 - 视频描述，字幕支持

### Pending Tasks 📋

#### AI/ML & Advanced Demos (CTO Expectation: Cutting-Edge Technology)

- [x] **ONNX Runtime Web AI 演示** (Staff Level: ML Engineering)
  - [x] ONNX Runtime Web 集成 - 模型加载，推理管道
  - [x] 模型加载和推理 - 多种模型支持，批量推理
  - [x] WebGPU/WebNN 加速配置 - 性能对比，回退策略
  - [x] 实时推理演示 - 摄像头输入，实时处理
  - [x] 性能对比可视化 - CPU vs GPU vs WebNN，延迟对比
  - [x] **响应式优化** - 移动端模型选择，性能适配
  - [x] **无障碍** - 推理结果描述，键盘控制

- [x] **AI Agent 集成** (CTO Expectation: Production AI Systems)
  - [x] Gemini API 集成 - 流式响应，错误处理，重试机制
  - [x] OpenAI API 集成 - 流式响应，token 管理，成本跟踪
  - [x] 流式响应处理 - 实时显示，性能优化
  - [x] 多模型对比界面 - 响应时间，质量对比，成本分析
  - [x] 智能助手功能实现 - 上下文管理，记忆功能
  - [x] **响应式优化** - 移动端聊天界面，触摸输入
  - [x] **无障碍** - 聊天内容可访问，语音输入支持
  - [x] **全局 AI Agent 集成** (CTO Expectation: Full App Integration)
    - [x] 全局 AI Agent 服务 - 命令系统、操作执行、上下文感知
    - [x] 全局 AI Agent UI - 浮动按钮、聊天界面、独立附件设计
    - [x] 页面导航功能 - 路由跳转、页面识别
    - [x] 操作执行功能 - 模型加载、推理执行、主题切换等
    - [x] 上下文感知 - 页面内容分析、状态读取
    - [x] 苹果液态玻璃风格 - 护眼配色、玻璃态效果、高对比度
    - [x] 独立附件设计 - 无背景遮罩、点击页面不关闭
    - [x] **响应式优化** - 移动端和桌面端完整适配
    - [x] **无障碍支持** - WCAG 2.2 AAA 完整实现

#### Cloud Services Integration (CTO Expectation: Multi-Cloud Expertise)

- [x] **AWS 集成** (Staff Level: Enterprise Cloud Architecture)
  - [x] S3 文件上传/下载 - 进度显示，错误处理，分片上传
  - [x] Lambda 函数调用 - 异步调用，错误处理，成本监控
  - [x] API Gateway 集成 - RESTful API，认证授权
  - [x] CloudWatch 监控数据 - 实时指标，告警配置
  - [x] DynamoDB 演示 - CRUD 操作，查询优化，成本分析
  - [x] **响应式优化** - 移动端文件操作，触摸上传
  - [x] **WCAG 2.2 AAA** - 无障碍支持，键盘导航，屏幕阅读器

- [x] **Azure 集成** (Staff Level: Multi-Cloud Strategy)
  - [x] Blob Storage 操作 - 文件管理，CDN 集成
  - [x] Azure Functions 调用 - Serverless 架构，触发器配置
  - [x] Cognitive Services API 演示 - 图像识别，文本分析
  - [x] Azure AI Services 集成 - 多服务集成，成本优化
  - [x] **响应式优化** - 移动端服务调用，简化界面
  - [x] **成本分析** - 使用量监控，成本预测，D3.js 可视化

- [x] **Vercel 集成** (CTO Expectation: Modern Deployment)
  - [x] Edge Functions 演示 - 全球边缘部署，低延迟
  - [x] Analytics 数据展示 - 实时分析，性能指标
  - [x] Serverless Functions - 函数监控，冷启动优化
  - [x] Vercel KV 缓存演示 - 缓存策略，性能提升
  - [x] **响应式优化** - 移动端分析视图
  - [x] **WCAG 2.2 AAA** - 图表数据表格化，键盘导航，屏幕阅读器支持

#### Advanced Features (CTO Expectation: Innovation & Technical Depth)

- [ ] **WebRTC 实时协作** (Staff Level: Real-time Systems)
  - [ ] WebRTC 连接建立 - STUN/TURN 配置，NAT 穿透
  - [ ] 视频通话功能 - 多用户支持，质量自适应
  - [ ] 共享白板 - 实时同步，冲突解决
  - [ ] 代码协作编辑器 - CRDT 同步，语法高亮
  - [ ] **响应式优化** - 移动端视频通话，触摸控制
  - [ ] **性能优化** - 带宽自适应，质量降级

- [ ] **Web3 集成** (CTO Expectation: Emerging Technology)
  - [ ] MetaMask 连接 - 钱包集成，交易签名
  - [ ] 智能合约交互 - 读取/写入，Gas 优化
  - [ ] NFT 展示 - 元数据获取，图片优化
  - [ ] **响应式优化** - 移动端钱包连接
  - [ ] **安全** - 交易确认，错误处理

- [ ] **GraphQL 集成** (Staff Level: API Architecture)
  - [ ] Apollo Server 设置 - Schema 设计，Resolver 优化
  - [ ] Apollo Client 配置 - 缓存策略，查询优化
  - [ ] 实时订阅 - WebSocket 集成，订阅管理
  - [ ] **响应式优化** - 移动端查询界面
  - [ ] **性能** - 查询优化，N+1 问题解决

- [ ] **CRDT 实时同步** (Staff Level: Distributed Systems)
  - [ ] Yjs 集成 - 文档同步，冲突解决
  - [ ] 冲突解决 - 自动合并，冲突检测
  - [ ] 离线支持 - 本地存储，同步恢复
  - [ ] **响应式优化** - 移动端编辑体验
  - [ ] **性能** - 同步延迟，带宽优化

#### Pages (CTO Expectation: Professional Presentation)

- [ ] **项目作品集页面** (Staff Level: Portfolio & Case Studies)
  - [ ] 项目数据管理 - 结构化数据，分类标签
  - [ ] 卡片布局 - 响应式网格，移动端优化
  - [ ] 详情模态框 - 项目详情，技术栈展示
  - [ ] AI 生成描述集成 - 自动生成，人工审核
  - [ ] **响应式优化** - 移动端卡片布局，触摸交互
  - [ ] **WCAG 2.2 AAA** - 语义化 HTML，键盘导航，屏幕阅读器支持
  - [ ] **性能** - 图片懒加载，代码分割

- [ ] **技能展示页面** (CTO Expectation: Technical Competency)
  - [ ] 技能雷达图 - D3.js 可视化，交互式图表
  - [ ] 技术栈图标 - 图标库，分类展示
  - [ ] 经验年限展示 - 时间线，项目关联
  - [ ] 技能熟练度可视化 - 进度条，等级显示
  - [ ] **响应式优化** - 移动端图表适配，简化视图
  - [ ] **WCAG 2.2 AAA** - 图表数据表格化，颜色对比度
  - [ ] **数据驱动** - 技能数据管理，动态更新

- [ ] **联系表单页面** (Staff Level: User Experience)
  - [ ] 表单验证 - 实时验证，错误提示
  - [ ] AI 辅助回复 - 智能回复，上下文理解
  - [ ] 邮件发送 - 云服务集成，队列处理
  - [ ] 防垃圾邮件保护 - reCAPTCHA，速率限制
  - [ ] **响应式优化** - 移动端表单，触摸输入
  - [ ] **WCAG 2.2 AAA** - 表单标签，错误描述，键盘导航
  - [ ] **安全** - CSRF 保护，输入验证，XSS 防护

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

- [ ] **国际化与无障碍** (CTO Expectation: Global & Inclusive)
  - [ ] i18n 配置 - 多语言支持，语言切换
  - [ ] **WCAG 2.2 AAA 完整实现**:
    - [ ] 颜色对比度 7:1 (正常文本) / 4.5:1 (大文本)
    - [ ] 所有交互元素键盘可访问
    - [ ] 屏幕阅读器完整支持 (ARIA labels, semantic HTML)
    - [ ] 焦点指示器清晰可见
    - [ ] 错误消息明确标识和描述
    - [ ] 跳过导航链接
    - [ ] 所有图片和图标有文本替代
    - [ ] 动画尊重 prefers-reduced-motion
    - [ ] 表单标签和错误关联
    - [ ] 键盘陷阱处理
  - [ ] **响应式设计完整实现**:
    - [ ] 移动端 (< 768px) 完整测试和优化
    - [ ] 平板端 (768px - 1023px) 适配
    - [ ] 桌面端 (1024px+) 优化
    - [ ] 触摸交互优化
    - [ ] 移动端导航优化
    - [ ] 响应式图片和媒体
    - [ ] 断点测试 (320px, 375px, 768px, 1024px, 1440px, 1920px)

#### Showcase Features
- [ ] 代码雨效果
- [ ] 音乐可视化
- [ ] 手势控制
- [ ] 语音交互
- [ ] 实时协作游戏
- [ ] 代码编辑器集成
- [ ] 实时数据流可视化
- [ ] 3D 作品集展示

#### Testing & Quality Assurance (CTO Expectation: Production Quality)

- [ ] **单元测试** (Staff Level: Test Coverage)
  - [ ] 组件测试 - React Testing Library，覆盖率 > 80%
  - [ ] 工具函数测试 - Jest，边界条件测试
  - [ ] API 路由测试 - 请求/响应测试，错误处理
  - [ ] 性能测试 - 渲染性能，内存泄漏检测
  - [ ] **响应式测试** - 多设备测试，断点测试

- [ ] **E2E 测试** (CTO Expectation: User Journey)
  - [ ] Playwright 配置 - 多浏览器测试
  - [ ] 关键路径测试 - 用户流程，交互测试
  - [ ] 移动端 E2E - 触摸交互，响应式测试
  - [ ] 无障碍测试 - 键盘导航，屏幕阅读器测试
  - [ ] 性能测试 - 加载时间，交互延迟

- [ ] **性能优化** (Staff Level: Performance Engineering)
  - [ ] Core Web Vitals 优化 - LCP < 2.5s, FID < 100ms, CLS < 0.1
  - [ ] 代码分割 - 路由级别，组件级别
  - [ ] 图片优化 - Next.js Image，WebP，懒加载
  - [ ] 字体优化 - 字体预加载，字体显示策略
  - [ ] 缓存策略 - 静态资源缓存，API 缓存
  - [ ] Bundle 分析 - 包大小优化，Tree shaking
  - [ ] **移动端性能** - 移动端优化，网络优化

- [ ] **SEO 优化** (CTO Expectation: Visibility)
  - [ ] Meta 标签优化 - 标题，描述，Open Graph
  - [ ] 结构化数据 - JSON-LD，Schema.org
  - [ ] Sitemap 生成 - 自动生成，更新机制
  - [ ] Robots.txt 配置
  - [ ] 语义化 HTML - 正确的 HTML5 标签
  - [ ] 内部链接优化

- [ ] **Vercel 部署配置** (Staff Level: DevOps)
  - [ ] 生产环境配置 - 环境变量，构建优化
  - [ ] CI/CD 集成 - GitHub Actions，自动部署
  - [ ] 预览部署 - PR 预览，分支部署
  - [ ] 监控集成 - Vercel Analytics，错误追踪
  - [ ] 性能监控 - 实时监控，告警配置
  - [ ] **多环境管理** - 开发，预发布，生产

- [ ] **环境变量设置** (CTO Expectation: Security)
  - [ ] 环境变量管理 - 安全存储，访问控制
  - [ ] 密钥轮换 - 定期更新，版本管理
  - [ ] 敏感信息保护 - 不提交到 Git，加密存储

- [ ] **PWA 配置** (Staff Level: Modern Web)
  - [ ] Service Worker - 离线支持，缓存策略
  - [ ] Manifest 文件 - 应用信息，图标配置
  - [ ] 安装提示 - 安装引导，更新提示
  - [ ] 离线功能 - 离线访问，数据同步
  - [ ] **响应式 PWA** - 移动端优化，触摸图标

## Development Rules

⚠️ **CRITICAL: Use ONLY Bulma CSS - No Custom CSS, No Inline Styles**
- **STRICTLY** use only Bulma's native classes and components
- **ABSOLUTELY NO** inline CSS styles (`style={{}}`)
- **ABSOLUTELY NO** custom CSS classes or styles
- **ABSOLUTELY NO** overriding Bulma's default styles
- Use Bulma's built-in modifiers: `is-*`, `has-*`, spacing utilities (`mb-*`, `mt-*`, etc.)
- For positioning, use Bulma classes: `is-relative`, `is-absolute`, `is-fixed`
- For sizing, use Bulma classes: `is-fullwidth`, `is-fullheight`, etc.
- See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed guidelines

⚠️ **CRITICAL: Responsive Design & Mobile-First**
- **MANDATORY**: All components must be fully responsive
- **Mobile-first approach**: Design for mobile (< 768px) first, then enhance for larger screens
- **Breakpoints**: Test on 320px, 375px, 768px, 1024px, 1440px, 1920px
- **Touch optimization**: All interactive elements must be touch-friendly (min 44x44px)
- **Mobile navigation**: Hamburger menu for mobile, horizontal nav for desktop
- **Responsive images**: Use Next.js Image component with responsive sizes
- **Touch gestures**: Implement swipe, pinch, and other mobile gestures where appropriate

⚠️ **CRITICAL: WCAG 2.2 AAA Compliance**
- **Color contrast**: 7:1 for normal text, 4.5:1 for large text (18pt+ or 14pt+ bold)
- **Keyboard navigation**: All interactive elements must be keyboard accessible
- **Screen readers**: Proper ARIA labels, semantic HTML, role attributes
- **Focus indicators**: Visible focus indicators on all focusable elements (min 2px outline)
- **Error messages**: Clearly identified, described, and associated with form fields
- **Skip navigation**: Skip links for main content
- **Text alternatives**: All images, icons, and non-text content must have alt text or aria-label
- **Animation**: Respect `prefers-reduced-motion` media query
- **Form labels**: All form inputs must have associated labels
- **Keyboard traps**: No keyboard traps, all modals must be keyboard dismissible
- **Testing**: Test with screen readers (NVDA, JAWS, VoiceOver), keyboard-only navigation

## Package Manager

- Use **pnpm** for all package management operations

## Git Configuration

- Email: zxcwqer9l@gmail.com
- Name: xiaooye

