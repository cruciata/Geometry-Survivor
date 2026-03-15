<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/09deb8b7-cc33-48cd-97cc-5b45947791e0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 微信小程序（web-view 壳）

本项目已提供小程序壳：
- 配置页：`pages/index/index`
- 承载页：`pages/webview/index`

### 如何填写 H5 地址

1. 先部署 H5（`npm run build` 后把 `dist/` 部署到 HTTPS 域名）
2. 在微信开发者工具打开项目，进入首页输入框
3. 填入完整地址，例如：`https://cruciata.github.io/Geometry-Survivor/`
4. 点击“保存地址”
5. 点击“打开游戏”即可在小程序内加载

### 必须满足的条件

- 只能使用 `https://` 地址
- 该域名必须在微信公众平台配置为“业务域名”
- H5 页面要能在手机浏览器直接访问

## GitHub Pages 自动部署

已添加工作流：`.github/workflows/deploy-pages.yml`

推送到 `main` 分支后会自动构建并发布到：

`https://cruciata.github.io/Geometry-Survivor/`

如果首次部署后页面未生效：

1. 进入 GitHub 仓库 `Settings` → `Pages`
2. `Source` 选择 `GitHub Actions`
3. 等待 `Actions` 中 `Deploy to GitHub Pages` 完成
