/**
 * マイルストーントラッカー - ★9統合テスト成功請負人が活用する処理時間計測ユーティリティ
 * 
 * 統合テストの各段階での処理時間を計測し、パフォーマンス問題の特定やデバッグを支援
 */
export class MilestoneTracker {
  private milestones: Record<string, number> = {};
  private startTime: number = Date.now();
  private currentOp: string = "初期化";

  /**
   * 操作の設定
   */
  setOperation(op: string): void {
    this.currentOp = op;
    console.log(`[${this.getElapsed()}] ▶️ 開始: ${op}`);
  }

  /**
   * マイルストーンの記録
   */
  mark(name: string): void {
    this.milestones[name] = Date.now();
    console.log(`[${this.getElapsed()}] 🏁 ${name}`);
  }

  /**
   * 結果表示（★9のデバッグで重要）
   */
  summary(): void {
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
  private getElapsed(): string {
    return `${((Date.now() - this.startTime) / 1000).toFixed(2)}秒`;
  }

  /**
   * 閾値チェック機能（パフォーマンス問題の検出）
   */
  checkThreshold(operationName: string, maxSeconds: number): boolean {
    const lastMarkTime = this.milestones[operationName];
    if (!lastMarkTime) {
      console.warn(`⚠️ マイルストーン '${operationName}' が見つかりません`);
      return false;
    }

    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed > maxSeconds) {
      console.warn(`⏰ パフォーマンス警告: ${operationName} が${elapsed.toFixed(2)}秒かかりました（閾値: ${maxSeconds}秒）`);
      return false;
    }

    console.log(`✅ パフォーマンス OK: ${operationName} - ${elapsed.toFixed(2)}秒（閾値: ${maxSeconds}秒）`);
    return true;
  }

  /**
   * リセット機能（複数テストケースで再利用）
   */
  reset(): void {
    this.milestones = {};
    this.startTime = Date.now();
    this.currentOp = "初期化";
    console.log("🔄 MilestoneTracker リセット完了");
  }
}