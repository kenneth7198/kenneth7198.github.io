# 成語大辭典 — GitHub Pages 靜態網站

收錄 **32,616 條中文成語**，支援搜尋、來源篩選、分頁瀏覽與詳細查閱。

## 檔案說明

| 檔案 | 說明 |
|------|------|
| `index.html` | 前端應用程式（完全靜態，無需伺服器） |
| `idioms_data.json` | 完整成語資料（10.7 MB） |

## 如何啟用 GitHub Pages

1. 在 GitHub 儲存庫 → **Settings** → **Pages**
2. Source 選擇 **Deploy from a branch**
3. Branch 選 `main`（或 `master`），Folder 選 **`/docs`**
4. 點擊 **Save** — 幾分鐘後即上線

網址格式：`https://<username>.github.io/<repo-name>/`

## 本地測試

```bash
cd docs
python -m http.server 8080
# 開啟 http://127.0.0.1:8080
```

## 功能

- 🔍 **搜尋**：搜尋成語、拼音、釋義
- 🗂️ **篩選**：依來源切換（教育部 / 開源 / CIP / ChID）
- 📄 **分頁**：每頁 24 條
- 🪟 **詳細**：點擊卡片查看完整釋義、典故、例句

## 資料來源

| 來源 | 條數 |
|------|------|
| 教育部成語典 | 1,652 |
| 開源資料集(中華新華成語辭典) | 30,809 |
| CIP( Chinese-Idiom-Paraphrasing ) 成語釋義 | 131 |
| ChID(A Large-scale Chinese IDiom Dataset) 成語辭典 | 24 |
| **合計** | **32,616** |
