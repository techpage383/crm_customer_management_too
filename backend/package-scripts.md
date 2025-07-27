# セットアップ手順

## 1. PostgreSQLのインストールと設定

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

## 2. データベースとユーザーの作成
```bash
sudo -u postgres psql

CREATE DATABASE customer_db;
CREATE USER customer_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE customer_db TO customer_user;
\q
```

## 3. 環境変数の設定
```bash
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定
```

## 4. データベースセットアップ
```bash
npm run db:setup
```