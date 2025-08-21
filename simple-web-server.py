#!/usr/bin/env python3
# 最強タスク管理ツール - 簡単Webサーバー

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8080
DIRECTORY = "/home/muranaka-tenma/顧客管理ツール/frontend/build"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    # ビルドディレクトリの存在確認
    if not os.path.exists(DIRECTORY):
        print(f"❌ ビルドディレクトリが見つかりません: {DIRECTORY}")
        print("先にフロントエンドをビルドしてください:")
        print("cd /home/muranaka-tenma/顧客管理ツール/frontend && npm run build")
        exit(1)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🌟 最強タスク管理ツール - Webサーバー起動")
            print(f"📡 ポート: {PORT}")
            print(f"📁 ディレクトリ: {DIRECTORY}")
            print(f"🌐 URL: http://localhost:{PORT}")
            print(f"🛑 停止するには Ctrl+C を押してください")
            
            # ブラウザを自動で開く（オプション）
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("✅ ブラウザを開きました")
            except:
                print("ℹ️ ブラウザの自動起動に失敗しました。手動で開いてください")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 サーバーを停止しました")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ ポート {PORT} は既に使用されています")
            print("他のポートを試すか、既存のサーバーを停止してください")
        else:
            print(f"❌ エラー: {e}")