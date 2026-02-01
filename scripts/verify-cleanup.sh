#!/bin/bash
# 验证挖矿清理与服务器更新是否完成 - 在服务器上执行
# 用法：chmod +x verify-cleanup.sh && ./verify-cleanup.sh

echo "=========================================="
echo "  乐高比价王 - 清理与更新验证"
echo "=========================================="
echo ""

PASS=0
FAIL=0

check() {
  if "$@"; then
    echo "  [OK] $1"
    ((PASS++))
    return 0
  else
    echo "  [FAIL] $1"
    ((FAIL++))
    return 1
  fi
}

echo "[1] 挖矿进程检查"
if ps aux | grep -E "/tmp/mysql|/tmp/init" | grep -v grep >/dev/null 2>&1; then
  echo "  [FAIL] 发现可疑进程，请执行: sudo kill -9 <PID>"
  ps aux | grep -E "/tmp/mysql|/tmp/init" | grep -v grep
  ((FAIL++))
else
  echo "  [OK] 无 /tmp/mysql 或 /tmp/init 进程"
  ((PASS++))
fi
echo ""

echo "[2] 宿主机 /tmp 文件检查"
if [ -f /tmp/mysql ] || [ -f /tmp/init ]; then
  echo "  [FAIL] 发现可疑文件:"
  ls -la /tmp/mysql /tmp/init 2>/dev/null
  ((FAIL++))
else
  echo "  [OK] /tmp/mysql 和 /tmp/init 已删除"
  ((PASS++))
fi
echo ""

echo "[3] 容器内文件检查"
if command -v docker &>/dev/null; then
  for c in lego_price_king_app lego_price_king_db; do
    if docker ps --format '{{.Names}}' | grep -q "^${c}$"; then
      if docker exec "$c" test -f /tmp/mysql 2>/dev/null || docker exec "$c" test -f /tmp/init 2>/dev/null; then
        echo "  [FAIL] 容器 $c 内仍有可疑文件"
        ((FAIL++))
      else
        echo "  [OK] 容器 $c 内已清理"
        ((PASS++))
      fi
    fi
  done
else
  echo "  [SKIP] Docker 未安装"
fi
echo ""

echo "[4] 代码版本检查"
if [ -d /opt/lego-price-king/.git ]; then
  cd /opt/lego-price-king
  LATEST=$(git log -1 --oneline 2>/dev/null)
  if echo "$LATEST" | grep -qE "c491427|2769667"; then
    echo "  [OK] 已更新到最新: $LATEST"
    ((PASS++))
  else
    echo "  [WARN] 当前: $LATEST，建议执行: git pull origin main"
  fi
else
  echo "  [SKIP] 非 Git 仓库"
fi
echo ""

echo "[5] Docker 服务检查"
if command -v docker &>/dev/null && [ -f /opt/lego-price-king/docker-compose.yml ]; then
  cd /opt/lego-price-king
  if docker compose ps 2>/dev/null | grep -q "Up"; then
    echo "  [OK] 应用服务运行中"
    ((PASS++))
  else
    echo "  [FAIL] 应用未运行，请执行: docker compose up -d"
    ((FAIL++))
  fi
else
  echo "  [SKIP] Docker Compose 不可用"
fi
echo ""

echo "=========================================="
echo "  结果: $PASS 通过, $FAIL 失败"
echo "=========================================="
if [ $FAIL -gt 0 ]; then
  echo "请根据上方 [FAIL] 项执行相应操作后重新运行此脚本验证。"
  exit 1
else
  echo "验证通过。建议重启服务器后再次确认阿里云告警是否消除。"
  exit 0
fi
