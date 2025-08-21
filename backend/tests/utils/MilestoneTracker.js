/**
 * マイルストーントラッカー - ★9統合テスト成功請負人が活用する処理時間計測ユーティリティ
 * 
 * 統合テストの各段階での処理時間を計測し、パフォーマンス問題の特定やデバッグを支援
 */
class MilestoneTracker {
  constructor() {
    this.milestones = {};
    this.startTime = Date.now();
    this.currentOp = "初期化";
  }

  /**
   * 操作の設定
   */
  setOperation(op) {
    this.currentOp = op;
    console.log(`[${this.getElapsed()}] ▶️ 開始: ${op}`);
  }

  /**
   * マイルストーンの記録
   */
  mark(name) {
    this.milestones[name] = Date.now();
    console.log(`[${this.getElapsed()}] 🏁 ${name}`);
  }

  /**
   * 結果表示（★9のデバッグで重要）
   */
  summary() {
    console.log("\n--- 処理時間分析 ---");
    const entries = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);

    for (let i = 1; i < entries.length; i++) {
      const prev = entries[i-1];
      const curr = entries[i];
      const diff = (curr[1] - prev[1]) / 1000;
      console.log(`${prev[0]} → ${curr[0]}: ${diff.toFixed(2)}秒`);
    }

    console.log(`総実行時間: ${this.getElapsed()}\n`);
  }

  /**
   * 経過時間の取得
   */
  getElapsed() {
    return `${((Date.now() - this.startTime) / 1000).toFixed(2)}秒`;
  }

  /**
   * パフォーマンスチェック
   */
  checkPerformance(threshold = 5000) {
    const total = Date.now() - this.startTime;
    if (total > threshold) {
      console.warn(`⚠️  パフォーマンス警告: ${total}ms > ${threshold}ms`);
      return false;
    }
    return true;
  }
}

module.exports = { MilestoneTracker };