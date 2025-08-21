# 顧客管理ツール デプロイガイド

## 🚀 シンプルデプロイ完了状況

### デプロイ構成
- **フロントエンド**: Firebase Hosting
- **バックエンド**: モックAPIモード（実装完了後に本格API接続予定）
- **データベース**: PostgreSQL (Supabase) - 設定済み

### デプロイURL
- **本番サイト**: https://customer-management-tool.web.app
- **代替URL**: https://customer-management-tool.firebaseapp.com

## 📁 プロジェクト構成

```
顧客管理ツール/
├── frontend/               # React + TypeScript フロントエンド
│   ├── build/             # 本番ビルドファイル
│   ├── .env.production    # 本番環境設定
│   └── src/
├── backend/               # Node.js + Express バックエンド
│   ├── src/deploy-server.ts  # シンプルデプロイサーバー
│   └── .env               # バックエンド環境変数
├── firebase.json          # Firebase Hosting設定
├── .firebaserc           # Firebaseプロジェクト設定
└── service-account-key.json  # Firebase認証キー
```

## 🔧 環境変数設定

### フロントエンド (.env.production)
```env
# Production Configuration - Simple Deploy
REACT_APP_API_BASE_URL=https://customer-management-tool.web.app
REACT_APP_USE_MOCK_API=true

# Production Settings
REACT_APP_ENV=production
```

### バックエンド (.env)
```env
# サーバー設定
PORT=3000
NODE_ENV=development

# フロントエンドURL（CORS設定用）
FRONTEND_URL=http://localhost:5173

# データベース接続
DATABASE_URL=postgresql://postgres.nbgtyfuxmplfaserjthr:d.X@ziw!NzZM9g4@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# JWT設定
JWT_SECRET=8ce818e4a5e8bc8ec15af13d238f62c21007ee3907fbd819b78e1e88da092195
JWT_REFRESH_SECRET=f5360120b9b88b7a75d2cb4cb0eb01e661be8d30bb2f7ff5ef1c4a2be8841907

# Google OAuth設定（Gmail連携用）
GOOGLE_CLIENT_ID=48*****915-tvokcedsrq6phrkhptacgn8trapqpvu1.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🚀 デプロイ手順

### 1. フロントエンドビルド
```bash
cd frontend
npm run build
```

### 2. Firebase Hostingデプロイ
```bash
# Firebase CLIが必要（初回のみ）
npm install -g firebase-tools

# デプロイ実行
firebase deploy --only hosting
```

### 自動デプロイ（GitHub Actions）
- main ブランチへのプッシュで自動デプロイ
- ワークフローファイル: `.github/workflows/deploy.yml`

## 📊 現在の機能状況

### ✅ 動作確認済み機能
- ログインページ（モックデータ）
- ダッシュボード表示
- ユーザー管理ページ
- 企業管理ページ
- TODO管理ページ
- Gmail設定ページ
- プロダクト管理ページ

### 🔄 今後の実装予定
- 実際のAPI接続
- データベース連携
- Gmail API統合
- リアルタイム認証

## 🛠️ トラブルシューティング

### よくある問題

1. **ビルドエラーが発生した場合**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **デプロイエラーが発生した場合**
   ```bash
   firebase logout
   firebase login
   firebase deploy --only hosting
   ```

3. **Firebase設定の確認**
   - プロジェクトID: `customer-management-tool`
   - 設定ファイル: `.firebaserc`, `firebase.json`

## 📱 デプロイ後の確認事項

### チェックリスト
- [ ] ログインページが正常に表示される
- [ ] ダッシュボードにアクセスできる
- [ ] 各種管理ページが動作する
- [ ] モバイル表示が適切
- [ ] ページ遷移がスムーズ

### パフォーマンス確認
- ページ読み込み速度
- レスポンシブデザイン
- コンソールエラーの有無

## 🔐 セキュリティ設定

### Firebase Hosting セキュリティ
- HTTPS強制
- セキュリティヘッダー設定
- 適切なCORS設定

### 環境変数管理
- 機密情報は環境変数に格納
- 本番環境では適切な値に設定

## 📈 次のステップ

1. **API統合**: バックエンドとの実際の連携
2. **認証強化**: 本格的なJWT認証実装
3. **データベース**: PostgreSQL完全統合
4. **Gmail連携**: Gmail API実装
5. **監視**: エラー監視とログ設定

---

## 🎉 デプロイ完了！

**サイトURL**: https://customer-management-tool.web.app

シンプルな設定で素早くデプロイが完了しました。今後の機能追加も段階的に対応できる構成になっています。

**作成日**: 2025年8月1日
**バージョン**: v1.0.0