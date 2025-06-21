# Local Runner について
設定の `codeRunner.localRunnerURL` に API エントリポイントの URL を入れると動作します。

v2.14.0 現在は設定したあとページを更新すると使えるようになります。

# API
エントリポイントは一つで、 POST メソッドのリクエストボディで JSON データを与える形式になっています。

API からのレスポンスも JSON 形式で返してください。

## コンパイラ一覧クエリ

```ts
interface ListRequest {
    mode: "list";
}

type ListResponse = CompilerInfo[];
interface CompilerInfo {
    // 言語名
    language: string;
    // コンパイラ識別子。実行クエリのとき使われます
    compilerName: string;
    // 表示される名前
    label: string;
}
```

## 実行クエリ

```ts
interface RunQuery {
    mode: "run";
    compilerName: string;
    sourceCode: string;
    stdin: string;
}

interface RunResult {
    // success: 実行完了（実行エラー含む）
    // compileError: コンパイルエラー
    // internalError: その他のエラー
    status: "success" | "compileError" | "internalError";
    // 終了コード
    exitCode?: number;
    // 実行時間 [ms]
    time?: number;
    // 使用メモリ [KB]
    memory?: number;
    // 標準出力
    stdout?: string;
    // status == "success" のときは標準エラー出力、 "compileError" や "internalError" のときはエラーの内容
    stderr?: string;
}
```