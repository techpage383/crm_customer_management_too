# Node.js 20を使用（Cloud Runで推奨）
FROM node:20-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production

# アプリケーションコードをコピー
COPY . .

# TypeScriptをビルドまたはtsxで実行
RUN npm install -g tsx

# ポート3000を公開
EXPOSE 3000

# 本番環境設定
ENV NODE_ENV=production

# アプリケーションを起動（tsxで直接実行）
CMD ["tsx", "src/deploy-server.ts"]