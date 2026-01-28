import { HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      aria-hidden={props['aria-hidden'] ?? true}
      {...props}
    />
  );
}
