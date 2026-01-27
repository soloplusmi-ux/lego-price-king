# 淘宝真实价格与店铺链接接入说明

**分步操作请直接看： [TAOBAO_SETUP_GUIDE.md](./TAOBAO_SETUP_GUIDE.md)**  

该文档按「淘宝联盟推广位 → 开放平台应用与 API → .env 配置 → 重启验证」的顺序，逐步说明如何拿到并填写 `TAOBAO_APP_KEY`、`TAOBAO_APP_SECRET`、`TAOBAO_ADZONE_ID`，以及如何排查常见问题。

---

## 当前实现说明

- **`app/api/refresh-prices/route.ts`** 中的 `fetchTaobaoPrices` 已接入淘宝客 **物料搜索** 接口 `taobao.tbk.dg.material.optional`。
- 当 **`.env` 中三个变量均已正确配置** 且接口返回有效数据时：  
  - 「淘宝信价中位数」为基于真实商品价格计算的中位数；  
  - 「购买渠道」为真实店铺与推广链接。  
- **未配置或接口失败** 时，自动回退为**模拟数据**（示例店铺 + 淘宝搜索链接）。

只需按 **TAOBAO_SETUP_GUIDE.md** 完成配置，无需再改 `fetchTaobaoPrices` 的实现。
