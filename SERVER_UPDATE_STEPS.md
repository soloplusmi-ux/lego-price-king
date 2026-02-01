# 服务器更新与挖矿清理 - 分步操作指南

> 已推送到 GitHub：https://github.com/soloplusmi-ux/lego-price-king  
> 请在服务器上按顺序执行以下步骤。

---

## 重要提示：命令书写错误

**错误示例**：`sudo rm -f /tmp/init/tmp/mysql`  
- 这是**一个路径**（/tmp/init/tmp/mysql），不是两个文件，会导致删除失败。

**正确写法**：`sudo rm -f /tmp/init /tmp/mysql`  
- 注意**空格**：`/tmp/init` 和 `/tmp/mysql` 是**两个独立路径**。

---

## 第一步：SSH 登录服务器

```bash
ssh root@8.138.110.247
```

（或使用你习惯的登录方式）

---

## 第二步：终止挖矿进程（必做）

先查看当前高 CPU 进程，找到 `/tmp/mysql` 和 `init` 的 PID：

```bash
ps aux | grep -E "/tmp/mysql|/tmp/init"
```

或：

```bash
ps aux --sort=-%cpu | head -15
```

假设输出中有：
- **PID 15954** 运行 `/tmp/mysql`（CPU 很高）
- **PID 15869** 运行 `init`

执行终止（**把 PID 换成你实际看到的数字**）：

```bash
sudo kill -9 15954 15869
```

---

## 第三步：删除可疑文件（注意空格）

### 3.1 宿主机 /tmp

```bash
sudo rm -f /tmp/init /tmp/mysql
```

（`/tmp/init` 和 `/tmp/mysql` 之间有一个空格）

### 3.2 容器内（如存在）

```bash
docker exec lego_price_king_app rm -f /tmp/init /tmp/mysql
docker exec lego_price_king_db rm -f /tmp/init /tmp/mysql
```

同样注意：`/tmp/init` 和 `/tmp/mysql` 之间要有空格。

---

## 第四步：确认文件已删除

```bash
ls -la /tmp/init /tmp/mysql 2>/dev/null || echo "宿主机已清理"
docker exec lego_price_king_app ls -la /tmp/ 2>/dev/null || true
docker exec lego_price_king_db ls -la /tmp/ 2>/dev/null || true
```

如果显示 "No such file" 或 "已清理"，说明已删除。

---

## 第五步：拉取 GitHub 最新代码并更新应用

```bash
cd /opt/lego-price-king
git pull origin main
docker compose build --no-cache app
docker compose up -d
```

---

## 第六步：检查服务是否正常

```bash
docker compose ps
docker compose logs app --tail 30
```

应看到 app 和 postgres 在运行，且 app 日志无报错。

---

## 第七步：验证清单（自检是否全部完成）

请逐项确认：

| 序号 | 检查项 | 命令 | 期望结果 |
|------|--------|------|----------|
| 1 | 挖矿进程已终止 | `ps aux \| grep /tmp/mysql` | 无相关进程 |
| 2 | 宿主机 /tmp 已清理 | `ls /tmp/init /tmp/mysql 2>&1` | 提示 No such file |
| 3 | 容器内已清理 | `docker exec lego_price_king_db ls /tmp/mysql 2>&1` | 提示 No such file |
| 4 | CPU 恢复正常 | `top -b -n 1 \| head -15` | 无明显异常高 CPU 进程 |
| 5 | 代码已更新 | `cd /opt/lego-price-king && git log -1 --oneline` | 显示最新 commit（如 c491427） |
| 6 | 应用运行正常 | `docker compose ps` | app、postgres 均为 Up |
| 7 | 网站可访问 | 浏览器访问 `http://8.138.110.247:3000` | 首页正常打开 |

---

## 附录：可选清理脚本

若希望用脚本统一清理：

```bash
cd /opt/lego-price-king
chmod +x scripts/cleanup-mining-malware.sh
sudo ./scripts/cleanup-mining-malware.sh
```

然后再执行第五、六、七步。

---

*最后更新：2025-02-01*
