export default interface Result {
  // OK: 正常終了
  // AC: 正解
  // WA: 不正解
  // CE: コンパイルエラー
  // RE: 実行時エラー
  // TLE: 時間超過
  // MLE: メモリ超過
  // IE: 内部エラー（その他のエラー）
  status: "OK" | "AC" | "WA" | "CE" | "RE" | "TLE" | "MLE" | "IE";
  stdout?: string;
  stderr?: string;
  exitCode?: string;
  execTime?: number;
  memory?: number;
};