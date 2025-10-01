# CCFrame 部署流程改进说明

## 📋 改进概述

参考 [ssalgten.sh](../Delete%20after%20reading/ssalgten.sh) 的优秀设计，重构了 `ccframe.sh` 的部署流程，实现了"先配置后选择"的最佳实践。

## 🎯 核心理念

### 旧设计的问题

```bash
# ❌ 旧流程（容易出错）
1. 用户选择模式 (镜像 or 源码)
2. 镜像模式分支：
   - 生成 docker-compose.yml
   - 调用 ensure_env
     └─> configure_deployment_target
         └─> ensure_compose_http_mode (修改 docker-compose.yml)
         └─> generate_nginx_http_conf
3. 源码模式分支：
   - clone_project
   - 调用 ensure_env (同上)

问题：镜像模式先调用 ensure_env，再生成 docker-compose.yml
     导致 ensure_compose_http_mode 找不到文件或修改失败
```

### 新设计（参考 ssalgten.sh）

```bash
# ✅ 新流程（更合理）
1. 准备工作目录
2. 准备 docker-compose.yml（两种方式之一）
   - 镜像模式：generate docker-compose.yml → pull image
   - 源码模式：git clone (带着 docker-compose.yml)
3. 统一配置环境（两种模式共享）
   - generate .env
   - configure deployment mode → generate nginx.conf
   - modify docker-compose.yml (根据 SSL 模式)
4. 清理旧容器
5. 启动服务
```

## ✨ 用户体验改进

### 交互式模式选择

用户首次运行 `bash ccframe.sh install` 时，会看到友好的选择界面：

```bash
📦 CCFrame 部署模式选择

请选择部署方式：

  1) 🚀 镜像部署（推荐）
     ✓ 使用预构建的 Docker 镜像
     ✓ 部署时间：3-5 分钟
     ✓ 内存需求：最低 512MB
     ✓ 适合：生产环境快速部署

  2) 🔧 源码构建
     • 从 GitHub 克隆源码并本地构建
     ✓ 部署时间：15-30 分钟
     ✓ 内存需求：至少 2GB
     ✓ 适合：需要自定义修改代码

请选择 [1/2] (默认: 1):
```

### 命令行模式（保持兼容）

```bash
# 明确指定镜像模式
bash ccframe.sh install --from-image

# 明确指定源码模式
bash ccframe.sh install

# 菜单选择
bash ccframe.sh  # 进入交互菜单
# 选择 "1) 初始化部署（自动选择模式）"
```

## 📊 流程对比

| 阶段 | 旧流程（镜像模式） | 新流程（镜像模式） |
|------|-------------------|-------------------|
| 1 | ❌ 生成 docker-compose.yml | ✅ 创建工作目录 |
| 2 | ❌ 调用 ensure_env<br>└─ 尝试修改不存在的文件 | ✅ 生成 docker-compose.yml |
| 3 | - | ✅ 拉取镜像 |
| 4 | - | ✅ 配置环境 (.env + nginx.conf)<br>└─ 修改 docker-compose.yml ✓ |

## 🛠️ 技术细节

### 关键函数调用顺序

```bash
cmd_install() {
  # 1. 解析参数（支持 --from-image 保持兼容性）
  parse_arguments()
  
  # 2. 交互式选择（仅在未指定参数时）
  if [ "$USE_IMAGE" -eq 0 ] && is_interactive; then
    show_mode_selection_menu()
  fi
  
  # 3. 准备工作目录
  mkdir -p /opt/ccframe && cd /opt/ccframe
  
  # 4. 准备 docker-compose.yml
  if [ "$USE_IMAGE" -eq 1 ]; then
    prepare_image_compose()  # 生成镜像版
    docker pull $GHCR_IMAGE
  else
    clone_project()          # 克隆源码（含 compose）
    ensure_compose_integrity()
  fi
  
  # 5. 统一配置环境（两种模式共享）
  ensure_env()
    └─> configure_deployment_target()
        ├─> generate_nginx_http_conf() 或
        ├─> generate_nginx_https_conf()
        └─> ensure_compose_http_mode()  # 修改 docker-compose.yml
  
  # 6. 启动服务
  docker-compose up -d
}
```

### 配置文件生成顺序保证

| 文件 | 生成时机 | 修改者 | 用途 |
|------|----------|--------|------|
| `docker-compose.yml` | 阶段2 | 阶段3 修改 | Docker 服务编排 |
| `.env` | 阶段3 | - | 环境变量 |
| `nginx.conf` | 阶段3 | - | 反向代理配置 |

## 🎁 额外改进

### 1. 菜单文案优化

- ~~"初始化安装（源码构建）"~~
- ✅ "初始化部署（自动选择模式）"

更清晰地表达意图，让新用户不困惑。

### 2. 视觉引导

使用颜色和图标增强可读性：

- 🚀 镜像部署（推荐）- `${GREEN}` 绿色
- 🔧 源码构建 - `${YELLOW}` 黄色

### 3. 默认值优化

- 默认选择：镜像模式（适合 99% 用户）
- 按回车即可使用推荐选项
- 减少决策疲劳

## 📚 参考资料

- [ssalgten.sh 源码](../Delete%20after%20reading/ssalgten.sh) - 参考的优秀设计
- [DEPLOYMENT.md](../DEPLOYMENT.md) - 完整部署文档
- [SCRIPT_COMPARISON.md](../SCRIPT_COMPARISON.md) - 脚本功能对比

## 🎉 总结

这次重构的核心价值：

1. **更正确的执行顺序** - 先有 docker-compose.yml，再修改它
2. **更好的用户体验** - 交互式选择，清晰的说明
3. **更统一的逻辑** - 两种模式共享配置流程
4. **保持向后兼容** - 命令行参数仍然有效

参考业界最佳实践（ssalgten.sh），让 CCFrame 的部署更加可靠和用户友好。
