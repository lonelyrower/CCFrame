# 文档整合说明

这个文件记录了文档整合的建议（待完成）。

## 已完成的清理

✅ **已删除临时文档**（2025-10-01）
- DEPLOYMENT_STATUS.md - 部署状态记录
- SECURITY_FIXES.md - 安全修复记录
- FIXES_SUMMARY.md - 修复总结
- CI_FIX_SUMMARY.md - CI 修复总结
- check-ci-status.md - CI 状态检查

✅ **已移动到 docs/**
- BUILD_OPTIMIZATION.md → docs/operations/BUILD_OPTIMIZATION.md

## 待整合的文档

### 1. 部署相关文档整合

当前存在 3 个部署相关文档，建议整合为一个：

**现有文件：**
- `DEPLOYMENT.md` (4.9K) - 主要部署指南
- `VPS_DEPLOYMENT.md` (6.4K) - VPS 专用部署
- `DOCKER_BUILD.md` (1.9K) - Docker 构建说明

**整合建议：**

将内容整合到 `DEPLOYMENT.md`，按以下结构组织：

```markdown
# CCFrame 部署指南

## 目录
1. 快速开始
2. 使用脚本部署（推荐）
   - ccframe.sh 使用说明
   - 镜像模式 vs 源码模式
3. Docker 部署
   - Docker Compose 配置
   - 环境变量说明
4. VPS 部署详解
   - 系统要求
   - 安全配置
   - HTTPS 配置
5. 构建相关
   - Docker 镜像构建
   - 多阶段构建说明
6. 故障排查
7. 常见问题

## 内容来源：
- 基础框架：当前 DEPLOYMENT.md
- VPS 专用内容：从 VPS_DEPLOYMENT.md 提取
- 构建说明：从 DOCKER_BUILD.md 提取
```

**操作步骤：**

```bash
# 1. 备份原文件
cp DEPLOYMENT.md DEPLOYMENT.md.backup
cp VPS_DEPLOYMENT.md VPS_DEPLOYMENT.md.backup
cp DOCKER_BUILD.md DOCKER_BUILD.md.backup

# 2. 手动整合内容到 DEPLOYMENT.md

# 3. 删除原文件
rm VPS_DEPLOYMENT.md DOCKER_BUILD.md

# 4. 可选：将备份移动到 docs/archive/
mkdir -p docs/archive
mv *.backup docs/archive/
```

## 最终文档结构

整合完成后，根目录应该只保留这些核心文档：

```
项目根目录/
├── README.md              # 项目概述和快速开始 (23.4K)
├── CHANGELOG.md           # 版本变更历史 (2.0K)
├── QUICK_START.md         # 快速开始指南 (3.0K)
├── DEPLOYMENT.md          # 完整部署指南（整合后，约15K）
├── ARCHITECTURE.md        # 系统架构文档 (6.6K)
├── AGENTS.md              # AI 代理开发规范 (2.3K)
├── CODE_REVIEW.md         # 代码审查报告 (9.5K)
└── CCFRAME_FIX_PATCHES.md # 修复补丁说明 (6.7K)
```

**注意**：`CODE_REVIEW.md` 和 `CCFRAME_FIX_PATCHES.md` 是新创建的分析文档，可以考虑：
- 保留在根目录作为开发参考
- 或移动到 `docs/development/` 目录

## 清理效果

- 删除前：16 个 MD 文件
- 删除后：10 个 MD 文件
- 整合后：8 个 MD 文件（推荐）

整合后可以减少约 50% 的文档数量，同时保持完整性和可维护性。

## 下一步

1. 手动整合部署文档（需要仔细审查内容）
2. 更新 README.md 的文档链接
3. 提交更改

---

**创建时间**: 2025-10-01
**状态**: 待整合
