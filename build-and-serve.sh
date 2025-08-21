#!/bin/bash

# 顧客管理ツール - ビルド＆配信スクリプト
# 組織共有フォルダでの実行用

echo "🚀 顧客管理ツール - ビルド開始"

# フロントエンドのビルド
echo "📦 フロントエンドをビルドしています..."
cd frontend
npm run build

# ビルド結果をバックエンドにコピー
echo "📂 ビルド結果をバックエンドにコピーしています..."
rm -rf ../backend/frontend-build
cp -r build ../backend/frontend-build

cd ..

# バックエンドの起動
echo "🔧 バックエンドサーバーを起動しています..."
cd backend

# 環境変数設定
export NODE_ENV=production
export PORT=8080
export FRONTEND_URL=http://localhost:8080

# サーバー起動
npm start

echo "✅ サーバーが起動しました！"
echo "🌐 ブラウザで http://localhost:8080 にアクセスしてください"
echo "👥 チームメンバーは同じネットワーク内から <あなたのIPアドレス>:8080 でアクセス可能です"