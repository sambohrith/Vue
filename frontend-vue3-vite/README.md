# 信息管理系统 - 前端

基于 Vue 3 + TypeScript + Vite 构建的现代化管理后台前端。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Ant Design Vue** - 企业级 UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Pinia** - Vue 状态管理方案

## 项目结构

```
frontend/
├── src/
│   ├── api/          # API 接口封装
│   ├── assets/       # 静态资源
│   ├── components/   # 公共组件
│   ├── constants/    # 常量定义
│   ├── layouts/      # 布局组件
│   ├── router/       # 路由配置
│   ├── stores/       # Pinia 状态管理
│   ├── styles/       # 全局样式
│   ├── types/        # TypeScript 类型定义
│   ├── utils/        # 工具函数
│   └── views/        # 页面视图
├── public/           # 公共资源
└── index.html        # 入口 HTML
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 后端服务

后端服务运行在 `http://localhost:3001`，详见根目录的 `backend/` 文件夹。

## 端口配置

- 前端: `http://localhost:3000`
- 后端: `http://localhost:3001`
