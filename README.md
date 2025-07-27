# 顧客管理ツール with Gmail連携

## 概要
シンプルな顧客管理システムにGmail連携機能を追加し、顧客とのメール履歴を一元管理できるツールです。

## 主な機能
- 顧客情報の登録・管理
- Gmail同期による自動的なメール履歴取得
- 顧客ごとのコミュニケーション履歴表示

## 技術スタック
- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database: PostgreSQL
- Gmail Integration: Google OAuth2 + Gmail API

## セットアップ
### 前提条件
- Node.js 18+
- PostgreSQL 14+
- Google Cloud Projectの作成とGmail API有効化

### インストール
```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd frontend
npm install
```

### 環境変数設定
backend/.env を作成し、以下を設定：
```
DATABASE_URL=postgresql://user:password@localhost:5432/customer_db
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### 起動方法
```bash
# データベースマイグレーション
cd backend
npm run migrate

# バックエンド起動
npm run dev

# フロントエンド起動（別ターミナル）
cd frontend
npm run dev
```

アプリケーションは http://localhost:5173 でアクセス可能です。