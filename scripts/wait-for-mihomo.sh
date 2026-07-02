#!/bin/sh
# ============================================================
# 启动等待脚本：检测 mihomo 连通性
# ============================================================

echo "[panel] 等待 mihomo 就绪..."

# 最多等 15 秒
for i in $(seq 1 15); do
  if curl -sf -o /dev/null -m 2 "http://127.0.0.1:9090/version" 2>/dev/null; then
    echo "[panel] mihomo 连接正常，启动 API 服务"
    exec npx tsx apps/api/src/index.ts
  fi
  echo "[panel] 尝试 $i/15: mihomo 尚未就绪，等待 2 秒..."
  sleep 2
done

echo ""
echo "========================================"
echo "  [ERROR] 无法连接到 mihomo"
echo "========================================"
echo ""
echo "请检查宿主机上的 mihomo 是否已启动："
echo ""
echo "  1. 检查 mihomo 状态:"
echo "     systemctl status mihomo"
echo ""
echo "  2. 如果未运行，启动 mihomo:"
echo "     systemctl start mihomo"
echo "     # 或直接运行:"
echo "     mihomo -d /etc/mihomo"
echo ""
echo "  3. 确认 external-controller 监听 0.0.0.0:9090:"
echo "     ss -tlnp | grep 9090"
echo ""
echo "  4. 检查完后重启面板容器:"
echo "     docker-compose restart"
echo ""
echo "========================================"

# 仍然启动 API（即使 mihomo 未就绪，用户可以稍后修复）
echo "[panel] 启动 API 服务（mihomo 未连接，部分功能不可用）"
exec npx tsx apps/api/src/index.ts
