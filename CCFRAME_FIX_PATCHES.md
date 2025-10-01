# ccframe.sh 关键修复补丁

## 应用这些修复

### 修复 1: 镜像地址使用变量

```bash
# 在 prepare_image_compose() 函数中（约第 540 行）
# 将硬编码的镜像地址替换为变量

cat > docker-compose.yml <<EOF
services:
  web:
    image: ${GHCR_IMAGE}
    container_name: ccframe-web
    # ... 其余配置

  worker:
    image: ${GHCR_IMAGE}
    container_name: ccframe-worker
    # ... 其余配置
EOF
```

### 修复 2: Prisma 命令路径

```bash
# 在 docker-compose.yml 的 command 部分（约第 575-580 行和 619-622 行）
# 替换为：

    command:
      - sh
      - -c
      - |
        set -e
        echo 'Applying database migrations...'
        for i in $(seq 1 60); do npx prisma migrate deploy && break || (echo 'DB not ready, retry...' && sleep 2); done
        npx prisma generate
        node scripts/create-admin.js || true
        echo 'Starting Next.js server on port 3000...'
        npm start
```

### 修复 3: 添加镜像拉取验证

```bash
# 在 cmd_install() 和 cmd_update() 中（约第 914 和 959 行）
# 替换为：

    print_step "拉取最新镜像: $GHCR_IMAGE"
    if docker pull "$GHCR_IMAGE"; then
      print_success "镜像拉取成功"
    else
      print_error "镜像拉取失败"
      print_info "可能的原因："
      print_info "  1. 网络问题 - 请检查网络连接"
      print_info "  2. 镜像不存在 - 请确认镜像地址: $GHCR_IMAGE"
      print_info "  3. 认证问题 - 如果是私有镜像，需要先登录: docker login ghcr.io"
      exit 1
    fi
```

### 修复 4: 补充环境变量

```bash
# 在 prepare_image_compose() 的 web 服务环境变量部分添加：

    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      NEXTAUTH_URL: ${NEXTAUTH_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      INTERNAL_BASE_URL: ${INTERNAL_BASE_URL:-http://web:3000}
      ADMIN_EMAIL: ${ADMIN_EMAIL}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD}
      STORAGE_PROVIDER: ${STORAGE_PROVIDER:-local}
      IMAGE_PUBLIC_VARIANTS: ${IMAGE_PUBLIC_VARIANTS:-false}
      IMAGE_FORMATS: ${IMAGE_FORMATS:-webp,jpeg}
      IMAGE_VARIANT_NAMES: ${IMAGE_VARIANT_NAMES:-thumb,small,medium}
      NEXT_TELEMETRY_DISABLED: 1
      PIXABAY_API_KEY: ${PIXABAY_API_KEY:-}
      DEV_SEED_TOKEN: ${DEV_SEED_TOKEN:-}
      REDIS_URL: redis://redis:6379
      S3_ACCESS_KEY_ID: "${S3_ACCESS_KEY_ID:-minioadmin}"
      S3_SECRET_ACCESS_KEY: "${S3_SECRET_ACCESS_KEY:-minioadmin}"
      S3_BUCKET_NAME: "${S3_BUCKET_NAME:-ccframe}"
      S3_REGION: "${S3_REGION:-us-east-1}"
      S3_ENDPOINT: http://minio:9000
      FORCE_HTTPS: ${FORCE_HTTPS:-true}
      CDN_BASE_URL: ${CDN_BASE_URL:-}
```

### 修复 5: 统一健康检查端点

```bash
# 在 cmd_health() 函数中（约第 1095 行）
# 替换为：

cmd_health() {
  cd /opt/ccframe || { print_error "未找到项目目录，请先执行 install"; exit 1; }
  local base_url=$(get_env_value NEXTAUTH_URL)
  if [ -z "$base_url" ]; then
    base_url="http://$(detect_server_ip)"
  fi
  base_url=${base_url%/}
  # 使用统一的健康检查端点
  curl -fsSL "$base_url/api/health-simple" || echo '{"ok":false}'
}
```

### 修复 6: 改进 MinIO 初始化

```bash
# 在 prepare_image_compose() 的 minio-init 服务中（约第 669-688 行）
# 替换 command 部分为：

    command: >-
      set -e;
      echo "Waiting for MinIO to be ready...";
      until mc alias set local http://minio:9000 "$${MINIO_ROOT_USER}" "$${MINIO_ROOT_PASSWORD}" 2>/dev/null; do
        echo "MinIO not ready, waiting...";
        sleep 2;
      done;
      echo "MinIO is ready!";
      SHOULD_CREATE_USER=0;
      if [ -n "$${S3_ACCESS_KEY_ID}" ] && [ -n "$${S3_SECRET_ACCESS_KEY}" ]; then
        if [ "$${S3_ACCESS_KEY_ID}" != "$${MINIO_ROOT_USER}" ] || [ "$${S3_SECRET_ACCESS_KEY}" != "$${MINIO_ROOT_PASSWORD}" ]; then
          SHOULD_CREATE_USER=1;
        fi;
      fi;
      if [ "$${SHOULD_CREATE_USER}" -eq 1 ]; then
        mc admin user add local "$${S3_ACCESS_KEY_ID}" "$${S3_SECRET_ACCESS_KEY}" || true;
        mc admin policy attach local readwrite --user "$${S3_ACCESS_KEY_ID}" || true;
        echo "Created MinIO user: $${S3_ACCESS_KEY_ID}";
      fi;
      BUCKET_NAME="$${S3_BUCKET_NAME:-ccframe}";
      mc mb -p "local/$${BUCKET_NAME}" || true;
      mc mb -p local/photo-gallery || true;
      echo 'MinIO buckets initialized successfully';
```

### 修复 7: 添加 Nginx 安全头部

```bash
# 在 generate_nginx_http_conf() 和 generate_nginx_https_conf() 中
# 在 location / 块内添加：

    location / {
      # 安全头部
      add_header X-Frame-Options "SAMEORIGIN" always;
      add_header X-Content-Type-Options "nosniff" always;
      add_header X-XSS-Protection "1; mode=block" always;
      add_header Referrer-Policy "strict-origin-when-cross-origin" always;
      
      proxy_pass http://web_backend;
      # ... 其余配置
    }
```

### 额外改进：添加版本选择

```bash
# 在脚本开头（约第 52 行）添加：

# 镜像配置
IMAGE_TAG="${IMAGE_TAG:-latest}"  # 支持通过环境变量指定版本
GHCR_IMAGE="ghcr.io/lonelyrower/ccframe:${IMAGE_TAG}"

# 使用方法：
# IMAGE_TAG=v1.0.0 bash ccframe.sh install --from-image
```

### 额外改进：增加超时时间

```bash
# 在数据库等待逻辑中（约第 575 行）
# 将循环次数从 30 改为 60，总等待时间从 60 秒增加到 120 秒

for i in $(seq 1 60); do npx prisma migrate deploy && break || (echo 'DB not ready, retry...' && sleep 2); done
```

## 快速修复脚本

如果需要一次性应用所有修复，可以使用以下命令：

```bash
# 备份原文件
cp ccframe.sh ccframe.sh.backup

# 应用补丁（需要手动编辑，或使用 sed/awk）
# 建议使用文本编辑器逐个应用上述修复
```

## 测试建议

修复后测试步骤：

```bash
# 1. 测试镜像部署
bash ccframe.sh install --from-image

# 2. 检查容器状态
bash ccframe.sh status

# 3. 查看日志
bash ccframe.sh logs web
bash ccframe.sh logs worker

# 4. 健康检查
bash ccframe.sh health

# 5. 访问应用
curl http://YOUR_SERVER_IP/api/health-simple
```

## 总结

**关键修复点（必须应用）：**
1. ✅ 镜像地址使用变量
2. ✅ 修复 Prisma 命令路径（从 `./node_modules/.bin/` 改为 `npx`）
3. ✅ 添加镜像拉取验证

**重要改进（强烈建议）：**
4. ✅ 补充环境变量
5. ✅ 统一健康检查端点
6. ✅ 改进 MinIO 初始化
7. ✅ 添加 Nginx 安全头部

**可选优化：**
8. ✅ 支持版本选择
9. ✅ 增加超时时间

应用这些修复后，镜像部署模式将更加稳定可靠。
