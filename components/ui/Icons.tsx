'use client';

import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  filled?: boolean;
};

const defaultProps = {
  fill: 'none',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// 搜索图标 - 精致的放大镜
export function SearchIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" />
      {/* 高光效果 */}
      <path d="M8 8a3 3 0 013-3" stroke="currentColor" opacity="0.5" strokeWidth={1} />
    </svg>
  );
}

// 太阳图标 - 浅色模式
export function SunIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" fill="currentColor" fillOpacity={0.1} />
      <g stroke="currentColor">
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </g>
    </svg>
  );
}

// 月亮图标 - 深色模式
export function MoonIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke="currentColor"
        fill="currentColor"
        fillOpacity={0.1}
      />
      {/* 星星点缀 */}
      <circle cx="19" cy="5" r="0.5" fill="currentColor" opacity="0.6" />
      <circle cx="17" cy="8" r="0.3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// 用户图标
export function UserIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" fill="currentColor" fillOpacity={0.05} />
      <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" />
    </svg>
  );
}

// 登录图标
export function LoginIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" />
      <polyline points="10 17 15 12 10 7" stroke="currentColor" />
      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" />
    </svg>
  );
}

// 菜单图标
export function MenuIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" />
    </svg>
  );
}

// 关闭图标
export function CloseIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" />
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" />
    </svg>
  );
}

// 左箭头
export function ChevronLeftIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <polyline points="15 18 9 12 15 6" stroke="currentColor" />
    </svg>
  );
}

// 右箭头
export function ChevronRightIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <polyline points="9 18 15 12 9 6" stroke="currentColor" />
    </svg>
  );
}

// 首页图标
export function HomeIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6a1 1 0 00-1-1h-4a1 1 0 00-1 1v6H4a1 1 0 01-1-1V9.5z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" stroke="currentColor" />
      <path d="M9 21V12h6v9" stroke="currentColor" />
    </svg>
  );
}

// 图片/照片图标
export function PhotoIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity={0.15} />
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} fill="none" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21h14a2 2 0 002-2v-4z" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" fill="currentColor" fillOpacity={0.3} />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" />
    </svg>
  );
}

// 标签图标
export function TagIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <path
          d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
          fill="currentColor"
        />
        <circle cx="7" cy="7" r="1" fill="white" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" />
      <circle cx="7" cy="7" r="1" fill="currentColor" />
    </svg>
  );
}

// 系列/相册图标
export function CollectionIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <rect x="2" y="7" width="20" height="14" rx="2" fill="currentColor" />
        <path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth={1.5} fill="none" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" />
      <path d="M6 7V5a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" />
    </svg>
  );
}

// 上传图标
export function UploadIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <path
          d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242"
          stroke="currentColor"
          strokeWidth={1.5}
          fill="none"
        />
        <path d="M12 12v9M9 15l3-3 3 3" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242" stroke="currentColor" />
      <path d="M12 12v9M9 15l3-3 3 3" stroke="currentColor" />
    </svg>
  );
}

// 相册/文件夹图标
export function FolderIcon({ size = 24, className, filled = false, ...props }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <path
          d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" />
    </svg>
  );
}

// 设置图标
export function SettingsIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
      />
    </svg>
  );
}

// 统计图标
export function ChartIcon({ size = 24, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" />
      <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" />
      <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" />
    </svg>
  );
}

// 信息图标
export function InfoIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...defaultProps} {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" />
      <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" />
      <circle cx="12" cy="8" r="0.5" fill="currentColor" />
    </svg>
  );
}

// 勾选图标
export function CheckIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" {...props}>
      <polyline
        points="20 6 9 17 4 12"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 更多/菜单点图标
export function MoreIcon({ size = 24, filled, className, ...props }: IconProps) {
  if (filled) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
        <circle cx="12" cy="5" r="2" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <circle cx="12" cy="19" r="2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...props}>
      <circle cx="12" cy="5" r="1.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
      <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
      <circle cx="12" cy="19" r="1.5" stroke="currentColor" strokeWidth={1.5} fill="none" />
    </svg>
  );
}

// Logo 图标组件
export function LogoIcon({ size = 40, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} fill="none" {...props}>
      <defs>
        <linearGradient id="logoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--ds-accent, #e63946)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--ds-accent-soft, #ff6b7a)' }} />
        </linearGradient>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--ds-luxury, #d4af37)' }} />
          <stop offset="100%" style={{ stopColor: '#f4d03f' }} />
        </linearGradient>
      </defs>

      {/* 外环 */}
      <circle cx="32" cy="32" r="18" stroke="url(#logoAccent)" strokeWidth="2.5" fill="none" />

      {/* 内环 */}
      <circle cx="32" cy="32" r="12" stroke="url(#logoGold)" strokeWidth="1.5" fill="none" opacity="0.85" />

      {/* 光圈图案 */}
      <g opacity="0.2">
        <path d="M32 20 L37 32 L32 44 L27 32 Z" fill="url(#logoAccent)" />
        <path d="M20 32 L32 27 L44 32 L32 37 Z" fill="url(#logoAccent)" />
      </g>

      {/* 内圈 */}
      <circle cx="32" cy="32" r="6" fill="url(#logoAccent)" opacity="0.1" />

      {/* 中心焦点 */}
      <circle cx="32" cy="32" r="2.5" fill="url(#logoAccent)" />
      <circle cx="32" cy="32" r="1" fill="white" />

      {/* 取景框角落 */}
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-stone-900 dark:text-stone-50">
        <path d="M10 10 L10 18 M10 10 L18 10" />
        <path d="M54 10 L54 18 M54 10 L46 10" />
        <path d="M10 54 L10 46 M10 54 L18 54" />
        <path d="M54 54 L54 46 M54 54 L46 54" />
      </g>

      {/* 角落点缀 */}
      <g fill="url(#logoAccent)" opacity="0.5">
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="54" cy="10" r="1.5" />
        <circle cx="10" cy="54" r="1.5" />
        <circle cx="54" cy="54" r="1.5" />
      </g>
    </svg>
  );
}

// 空状态 - 无照片
export function EmptyPhotosIcon({ size = 128, className, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={className} fill="none" {...props}>
      <defs>
        <linearGradient id="emptyAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--ds-accent, #e63946)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--ds-accent-soft, #ff6b7a)' }} />
        </linearGradient>
      </defs>

      {/* 镜头环 */}
      <circle cx="64" cy="64" r="40" stroke="url(#emptyAccent)" strokeWidth="2" opacity="0.3" />
      <circle cx="64" cy="64" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.2" className="text-stone-400 dark:text-stone-600" />

      {/* 取景框角落 */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.3" className="text-stone-400 dark:text-stone-600">
        <path d="M24 24 L24 40 M24 24 L40 24" />
        <path d="M104 104 L104 88 M104 104 L88 104" />
      </g>

      {/* 中心加号暗示添加 */}
      <g stroke="url(#emptyAccent)" strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <line x1="64" y1="54" x2="64" y2="74" />
        <line x1="54" y1="64" x2="74" y2="64" />
      </g>
    </svg>
  );
}
