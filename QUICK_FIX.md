# 快速修复指南

## ✅ 已发现问题

检测到旧的 GitHub 凭据，这可能导致 "Empty reply from server" 错误。

---

## 🔧 立即执行以下步骤

### 步骤 1: 删除旧凭据

在 PowerShell 中执行：

```powershell
cmdkey /delete:LegacyGeneric:target=git:https://github.com
```

### 步骤 2: 测试连接

```powershell
cd C:\Users\Administrator\lego-price-king
git ls-remote origin
```

**如果提示输入用户名和密码：**
- 用户名：`soloplusmi-ux`
- 密码：**使用 Personal Access Token**（不是 GitHub 密码！）

### 步骤 3: 如果没有 Personal Access Token

1. 登录 GitHub
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. 勾选 `repo` 权限
5. 生成并复制 token（只显示一次！）
6. 在 Git 提示输入密码时，粘贴这个 token

### 步骤 4: 如果还是失败，尝试推送

```powershell
git push origin main
```

同样使用 Personal Access Token 作为密码。

---

## 🚀 或者：直接在服务器上修复（最快！）

如果 GitHub 推送还是有问题，直接在服务器上手动创建文件即可：

```bash
# SSH 连接到服务器
cd /opt/lego-price-king

# 创建工具函数
mkdir -p lib
cat > lib/priceHistory.ts <<'EOF'
import { Prisma } from '@prisma/client';

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export function parsePriceHistory(jsonValue: Prisma.JsonValue | null): PriceHistoryPoint[] {
  if (!jsonValue) return [];
  if (typeof jsonValue !== 'object' || !Array.isArray(jsonValue)) return [];
  const result: PriceHistoryPoint[] = [];
  for (const item of jsonValue) {
    if (item !== null && typeof item === 'object' && !Array.isArray(item) && 'date' in item && 'price' in item) {
      const dateValue = (item as any).date;
      const priceValue = (item as any).price;
      if (typeof dateValue === 'string' && typeof priceValue === 'number') {
        result.push({ date: dateValue, price: priceValue });
      }
    }
  }
  return result;
}
EOF

# 然后手动编辑 API 和页面文件，使用 parsePriceHistory 函数
# 最后重新构建 Docker
```

---

告诉我执行结果！
