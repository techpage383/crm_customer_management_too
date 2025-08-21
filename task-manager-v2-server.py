#!/usr/bin/env python3
# タスク管理ツール V2 - 簡単Webサーバー

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8082
DIRECTORY = "/home/muranaka-tenma/顧客管理ツール"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # ルートアクセス時はV2のHTMLファイルを表示
        if self.path == '/' or self.path == '/index.html':
            self.path = '/task-manager-v2-standalone.html'
        
        super().do_GET()

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"🚀 革新的タスク管理ツール V2 - Webサーバー起動")
            print(f"📡 ポート: {PORT}")
            print(f"📁 ディレクトリ: {DIRECTORY}")
            print(f"🌐 メインURL: http://localhost:{PORT}")
            print(f"🌐 直接URL: http://localhost:{PORT}/task-manager-v2-standalone.html")
            print(f"🛑 停止するには Ctrl+C を押してください")
            print()
            print("✨ 機能:")
            print("  - カスタムフロー設計")
            print("  - タスクドラッグ&ドロップ")
            print("  - リアルタイム統計")
            print("  - データ永続化")
            
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