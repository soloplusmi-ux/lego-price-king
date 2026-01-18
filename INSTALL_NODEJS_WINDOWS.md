# Windows 安装 Node.js 指南

## ❌ 问题：找不到 `node` 和 `npm` 命令

### 错误信息
```
CommandNotFoundException: 无法将"node"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
CommandNotFoundException: 无法将"npm"项识别为 cmdlet、函数、脚本文件或可运行程序的名称
```

### 原因
**您的 Windows 电脑上没有安装 Node.js！**

---

## ✅ 解决方案：安装 Node.js

### 方法 1: 使用官方安装程序（推荐）

#### 步骤 1: 下载 Node.js

1. 访问 Node.js 官网：https://nodejs.org/
2. 下载 **LTS 版本**（长期支持版本，推荐）
   - 点击绿色的 "LTS" 按钮
   - 选择 Windows Installer (.msi) - 64-bit
   - 文件大小约 30MB

#### 步骤 2: 安装 Node.js

1. 双击下载的 `.msi` 文件
2. 按照安装向导操作：
   - 点击 "Next" 继续
   - 接受许可协议
   - 选择安装路径（默认即可）
   - **重要**：确保勾选 "Add to PATH"（添加到系统路径）
   - 点击 "Install" 安装
   - 等待安装完成

#### 步骤 3: 验证安装

**关闭当前的 PowerShell 窗口，重新打开一个新的 PowerShell**（重要！）

然后执行：

```powershell
# 检查 Node.js 版本
node --version
# 应该显示: v18.x.x 或 v20.x.x

# 检查 npm 版本
npm --version
# 应该显示: 9.x.x 或 10.x.x
```

如果显示版本号，说明安装成功！

---

### 方法 2: 使用 Chocolatey（如果已安装）

如果您已经安装了 Chocolatey 包管理器：

```powershell
# 以管理员身份运行 PowerShell
choco install nodejs-lts
```

---

### 方法 3: 使用 winget（Windows 11/10 1809+）

```powershell
# 在 PowerShell 中执行
winget install OpenJS.NodeJS.LTS
```

---

## 🔧 安装后操作

### 1. 重新打开 PowerShell

**重要**：安装 Node.js 后，必须关闭并重新打开 PowerShell，环境变量才会生效。

### 2. 验证安装

```powershell
node --version
npm --version
```

### 3. 安装脚本依赖

```powershell
# 进入项目目录
cd C:\Users\Administrator\lego-price-king

# 进入 scripts 目录
cd scripts

# 安装依赖
npm install

# 返回项目根目录
cd ..
```

### 4. 上传数据

```powershell
# 确保在项目根目录
cd C:\Users\Administrator\lego-price-king

# 上传数据
node scripts/sync_custom_excel.js "f:\DS218+\SynologyDrive\brickmaster\brickset 数据\data2019.xlsx"
```

---

## ⚠️ 常见问题

### 问题 1: 安装后仍然找不到命令

**解决**：
1. **完全关闭 PowerShell**（关闭所有窗口）
2. **重新打开 PowerShell**
3. 如果还是不行，重启电脑

### 问题 2: 安装时没有勾选 "Add to PATH"

**解决**：
1. 重新运行安装程序
2. 选择 "Repair"（修复）选项
3. 确保勾选 "Add to PATH"

或手动添加到 PATH：
1. 右键"此电脑" → "属性" → "高级系统设置"
2. 点击"环境变量"
3. 在"系统变量"中找到 `Path`，点击"编辑"
4. 添加 Node.js 安装路径（通常是 `C:\Program Files\nodejs\`）

### 问题 3: 权限问题

如果遇到权限错误，以管理员身份运行 PowerShell：
1. 右键点击 PowerShell
2. 选择"以管理员身份运行"

---

## 📋 快速检查清单

安装完成后，确认：

- [ ] `node --version` 显示版本号
- [ ] `npm --version` 显示版本号
- [ ] 可以执行 `npm install`
- [ ] 可以执行 `node scripts/sync_custom_excel.js`

如果所有项目都完成，就可以开始上传数据了！
