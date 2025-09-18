# Improvement Log

## 2025-09-18
- [x] Document deployment configuration templates, Prometheus metrics export, and troubleshooting guidance.

## 2025-09-17
- [x] Normalize storage fallback so `getStorageManager()` always returns a synchronous manager (replace async local fallback and update dependents).
- [x] Remove brute-force embedding cap at 2k items so semantic search covers the full library.
- [x] Enforce unique `(userId, contentHash)` in Prisma schema and eliminate the broken `size` sort option that references a missing column.
- [x] Align PWA manifest icons with actually shipped assets to restore installability.
- [x] 优化图片服务路径，直接通过存储 SDK 读取原图，减少重复 fetch 和内存占用。
- [x] 语义搜索缓存命中逻辑升级，配合数据库字段读取优化降低 API 响应延迟。
- [x] 存储系统健康检查自动降级至本地文件系统，避免外部存储抖动导致服务不可用。
