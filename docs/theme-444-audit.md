# 444 主題系統盤點與驗證（2026-11-11）

## 範圍
- 只修改 444.html、css/theme-444.css、js/theme-444.js，並複製 js/app-222.js 成 js/app-444.js。
- 222.html、index.html、js/app-222.js、css/main.css 保留原樣。
- 444 已不再引用 js/app-222.js；原始功能程式逐字複製，未刪除資料或功能。
- 原有 490px 桌面寬度、手機捲動、Leaflet 地圖及回顧輸出結構保留。

## 共用語意配色
- 頁面：--rita-page
- 卡片／次級表面：--rita-card、--rita-card-soft
- 次要操作／hover：--rita-control、--rita-control-hover
- 分隔線：--rita-line
- 標題／內文／提示字：--rita-ink、--rita-muted、--rita-placeholder
- 主要操作背景／文字：--rita-action-bg、--rita-on-primary
- 頁首／預算區文字：--rita-on-header
- 次要按鈕文字：--rita-on-control

## 已接入範圍
- main 內 Tailwind 白色、灰色背景、灰色文字、邊框及輸入提示字
- 底部分頁導航背景及未選取文字
- 設定、行程編輯、紀念日編輯、更新日誌、匯入彈窗
- 匯入模式的選取／未選取狀態、確認按鈕
- 門票／交通／住宿／周邊與登出按鈕
- 頁首預算標籤、提醒及進度條
- 統計大型演出分隔線與場次數字
- 地圖重播控制列（不改地圖圖磚）
- 部分原先使用 themeColor 的主要操作按鈕，改用可讀性較高的衍生色

## 排除
- 活動、藝人自訂色；Leaflet 地圖圖磚、標記、路線；警告與成功狀態。
- share-template、share-template-legacy、回顧圖片內容的個別設計色。
- 未改動 Supabase、localStorage key、同步流程、匯入解析。

## 靜態檢查
- 444 引用 theme-444.css、theme-444.js、app-444.js；不再引用 app-222.js。
- app-444.js 與 app-222.js 內容 SHA 相同（複製當下）。
- 222.html 與 index.html 未修改。
- theme-444.css 沒有新增 !important。
- theme-444.js 沒有寫入 localStorage；監聽 #app 的 style 屬性以跟隨 Vue 的 --primary-color。
- 主題計算已針對深色、淺色、粉色、黃色、紫色、綠色、紅色等樣本進行對比計算。主要操作背景在必要時自動微調，避免文字對比低於 4.5:1。

## 尚需實際環境驗證
- 未取得 iPhone Safari 實機操作；不能宣稱手機實機通過。
- 未執行登入後的 Supabase 寫入、雲端同步、匯入、地圖重播或分享圖片完整端到端測試。
- 舊版 HTML 的少數行內顏色與專用元件可能仍有不一致，需要在實際畫面檢查後處理。
- 完成靜態檢查不等於所有畫面完成驗證。

## 新設計方向（待選擇，尚未套用）
A. 柔和追星手帳：奶油白、粉紫、圓角卡片、手帳式區塊。
B. 質感極簡：象牙白、深墨色、細分隔線、較多留白。
C. 活力應援：明亮撞色、資訊層級強、活動卡片突出。
所有方向都沿用相同語意配色系統，不需重做功能。
