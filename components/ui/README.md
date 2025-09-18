# UI组件库使用指南

本目录包含了CCFrame项目优化后的UI组件系统，提供了统一、高质量的用户界面组件。

## 🎯 组件概览

### 加载状态组件 (`skeleton.tsx`)

提供了多种骨架屏组件，用于改善加载体验：

```tsx
import { Skeleton, StatCardSkeleton, GalleryGridSkeleton, PhotoSkeleton } from '@/components/ui/skeleton'

// 基础骨架屏
<Skeleton className="h-4 w-[250px]" />

// 统计卡片骨架屏
<StatCardSkeleton />

// 画廊网格骨架屏
<GalleryGridSkeleton columns={4} rows={3} aspectRatio="square" />

// 照片骨架屏
<PhotoSkeleton aspectRatio="landscape" />
```

### 空状态组件 (`empty-state.tsx`)

用于显示空数据状态，提供友好的用户提示：

```tsx
import { EmptyState, EmptyPhotosState, EmptySearchState } from '@/components/ui/empty-state'

// 通用空状态
<EmptyState
  icon={Camera}
  title="暂无照片"
  description="还没有上传任何照片，快来分享你的美好时刻吧"
  action={{
    label: "上传照片",
    onClick: () => router.push('/admin/upload')
  }}
/>

// 专用空状态组件
<EmptyPhotosState onUpload={() => router.push('/admin/upload')} />
<EmptySearchState onReset={() => resetFilters()} />
```

### 错误状态组件 (`error-state.tsx`)

处理各种错误情况，提供清晰的错误信息和恢复操作：

```tsx
import { ErrorState, NetworkErrorState, UploadErrorState } from '@/components/ui/error-state'

// 通用错误状态
<ErrorState
  title="上传失败"
  message="文件上传过程中出现问题，请重试"
  error={error}
  showRetry
  onRetry={() => retryUpload()}
/>

// 专用错误状态
<NetworkErrorState onRetry={() => refetch()} />
<UploadErrorState onRetry={() => retry()} onBack={() => router.back()} />
```

### 渐进式图片加载 (`progressive-image.tsx`)

提供高性能的图片加载体验，支持懒加载和模糊占位符：

```tsx
import { ProgressiveImage, GalleryImage } from '@/components/ui/progressive-image'

// 通用渐进式图片
<ProgressiveImage
  src="/path/to/image.jpg"
  alt="描述"
  className="w-full h-auto"
  blurDataURL="data:image/jpeg;base64,..."
  onLoad={() => console.log('loaded')}
/>

// 画廊专用图片组件
<GalleryImage
  photoId="photo-123"
  variant="medium"
  format="webp"
  alt="照片描述"
  priority={false}
/>
```

### 增强按钮组件 (`button.tsx`)

提供统一的按钮样式和交互效果：

```tsx
import { Button } from '@/components/ui/button'

// 基础按钮
<Button variant="default" size="default">
  点击我
</Button>

// 图标按钮
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>

// 大型按钮
<Button variant="outline" size="lg">
  上传文件
</Button>
```

## 🎨 CSS动画类

新增了多种动画类，提升交互体验：

### 入场动画
```css
.animate-scale-in     /* 缩放入场 */
.animate-slide-up     /* 滑动入场 */
.animate-fade-in      /* 淡入 */
.animate-fade-in-stagger  /* 错开淡入 */
.animate-bounce-in    /* 弹跳入场 */
```

### 交互动画
```css
.hover-lift          /* 悬停上浮 */
.button-press        /* 按钮按压 */
.card-hover          /* 卡片悬停 */
.focus-ring          /* 聚焦环 */
```

### 触摸优化
```css
.touch-target        /* 44px最小触摸区域 */
.touch-manipulation  /* 优化触摸响应 */
```

## 📱 响应式设计原则

### 触摸友好
- 最小触摸目标: 44px (桌面) / 48px (移动端)
- 使用 `touch-manipulation` 优化触摸响应
- 合理的按钮间距和点击区域

### 动画性能
- 优先使用 `transform` 和 `opacity`
- 支持 `prefers-reduced-motion`
- 使用 `will-change` 优化性能

### 无障碍支持
- 完整的ARIA属性
- 键盘导航支持
- 屏幕阅读器友好
- 合理的颜色对比度

## 🔧 最佳实践

### 1. 组件选择
```tsx
// ❌ 不推荐：直接使用原生元素
<div className="bg-gray-200 animate-pulse h-4 w-20" />

// ✅ 推荐：使用统一的骨架屏组件
<Skeleton className="h-4 w-20" variant="text" />
```

### 2. 加载状态
```tsx
// ❌ 不推荐：简单的loading文字
{loading && <div>Loading...</div>}

// ✅ 推荐：使用相应的骨架屏
{loading ? <StatCardSkeleton /> : <StatCard {...props} />}
```

### 3. 空状态处理
```tsx
// ❌ 不推荐：简单文字提示
{photos.length === 0 && <div>暂无照片</div>}

// ✅ 推荐：使用专用空状态组件
{photos.length === 0 && (
  <EmptyPhotosState onUpload={() => router.push('/upload')} />
)}
```

### 4. 错误处理
```tsx
// ❌ 不推荐：alert或简单错误信息
{error && <div className="text-red-500">{error.message}</div>}

// ✅ 推荐：使用错误状态组件
{error && (
  <ErrorState
    error={error}
    onRetry={() => refetch()}
    showRetry
  />
)}
```

## 🎯 性能优化

### 图片加载
- 使用 `ProgressiveImage` 实现懒加载
- 提供模糊占位符改善感知性能
- 支持 WebP 和 AVIF 格式

### 动画优化
- CSS动画优于JavaScript动画
- 使用 `transform` 和 `opacity`
- 合理使用 `will-change`

### 组件复用
- 统一的设计系统
- 可配置的变体
- 一致的API设计

这套组件系统现在已经达到了企业级标准，可以为CCFrame项目提供统一、高质量的用户体验。