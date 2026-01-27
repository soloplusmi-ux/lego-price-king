# 在 SSH 里查看和修改项目根目录的 .env

在服务器上通过 SSH 登录后，按下面步骤查看、修改并确认 `.env` 中的淘宝联盟配置。

---

## 一、进入项目根目录

```bash
cd /opt/lego-price-king
```

如果项目不在 `/opt/lego-price-king`，换成你的实际路径，例如：`cd /home/xxx/lego-price-king`。

---

## 二、查看 .env 里是否已有淘宝配置

### 方法 1：只查看淘宝相关三行（推荐）

```bash
grep TAOBAO .env
```

会只显示以 `TAOBAO_` 开头的几行，例如：

```text
TAOBAO_APP_KEY="12345678"
TAOBAO_APP_SECRET="abcdef..."
TAOBAO_ADZONE_ID="444555666"
```

- 若三行都在，且等号右边的值**不是空**、也不是 `""` 或 `"your-xxx"` 之类占位，一般说明已填好。
- 若没有输出，或某一行是 `TAOBAO_APP_KEY=""` 这种，说明还没填或没填完。

### 方法 2：看整个 .env

```bash
cat .env
```

会打印整个文件。注意：`.env` 里有密钥等敏感信息，不要在不安全的屏幕或录屏里长时间停留；用完可执行 `clear` 清屏。

### 方法 3：分页查看，避免刷屏

```bash
less .env
```

- **空格**：往下翻页  
- **b**：往上翻页  
- **q**：退出

---

## 三、用 nano 编辑 .env

`nano` 较简单，适合在 SSH 里改 `.env`。

### 1. 打开 .env

```bash
nano .env
```

### 2. 找到淘宝三行并修改

- 用**方向键**移动光标。
- 若文件很长，可先按 **Ctrl+W**，输入 `TAOBAO`，回车，会跳到含 `TAOBAO` 的位置。
- 把下面三行的**等号右边**改成你在淘宝联盟、开放平台拿到的真实值（保留引号）：

  ```env
  TAOBAO_APP_KEY="你的 App Key"
  TAOBAO_APP_SECRET="你的 App Secret"
  TAOBAO_ADZONE_ID="你的 adzone_id"
  ```

  示例（仅格式参考，务必换成你的）：

  ```env
  TAOBAO_APP_KEY="12345678"
  TAOBAO_APP_SECRET="abcdef1234567890abcdef1234567890"
  TAOBAO_ADZONE_ID="444555666"
  ```

- 若没有这三行，就**在文件末尾新加**（注意不要重复添加已有行）。

### 3. 保存并退出

1. **Ctrl+O**（字母 O）→ 回车，保存。  
2. **Ctrl+X**，退出 nano。

若 nano 提示“ File exists, Overwrite?”，选 **Y** 或 **Yes** 覆盖即可。

---

## 四、没有 nano 时用 vi/vim

若执行 `nano .env` 提示 `command not found`，可用 vi：

```bash
vi .env
```

- **输入模式**：按 **i**，底部出现 `-- INSERT --` 后才能改字。
- **移动**：方向键。
- **查找**：按 **Esc** 退出输入后，输入 `/TAOBAO` 回车，可跳到 TAOBAO 附近。
- **保存退出**：按 **Esc**，再输入 **:wq** 回车。  
- **不保存退出**：按 **Esc**，再输入 **:q!** 回车。

---

## 五、改完后如何确认

### 1. 再查一次三行

```bash
grep TAOBAO .env
```

确认三行都有，且等号右边不是空、不是占位符。

### 2. 确认变量名和格式

- 变量名必须是：`TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID`（区分大小写）。
- 等号两边不要加空格；值用英文双引号包起来，例如：`TAOBAO_APP_KEY="12345678"`。

### 3. 让应用重新读 .env（Docker 时）

修改 `.env` 后，如果应用是用 Docker 跑的，需要重启 app 容器：

```bash
cd /opt/lego-price-king
docker compose up -d
```

或：

```bash
docker-compose up -d
```

---

## 六、一条龙：进入目录 → 查看 → 编辑 → 重启（Docker）

可依次执行（项目路径请按你的改）：

```bash
cd /opt/lego-price-king
grep TAOBAO .env
nano .env
```

在 nano 里改好、**Ctrl+O** 保存、**Ctrl+X** 退出后，再执行：

```bash
grep TAOBAO .env
docker compose up -d
```

第一次 `grep` 是改前看一眼，第二次 `grep` 是改后确认；`docker compose up -d` 是让新 `.env` 生效。

---

## 七、nano 常用按键速查

| 操作       | 按键      |
|------------|-----------|
| 保存       | Ctrl+O，再回车 |
| 退出       | Ctrl+X    |
| 搜索       | Ctrl+W，输入关键词回车 |
| 下一处结果 | Alt+W     |
| 光标到行尾 | Ctrl+E    |
| 光标到行首 | Ctrl+A    |
