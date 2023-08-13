# codeRunner

codeRunner は、「与えられたコードおよび入力を、オンラインでコードを実行するサービスに送信し、結果を返す」という機能を実現するためのモジュールです。

## index.ts

- `runners`: 各 `CodeRunner` を定義しています。キーは「言語名 説明」からなります。
  - 実行しているサイトが AtCoder の場合、 `AtCoderRunner` が使えます。
  - ほとんどの環境は手動で設定しているため、呼び出し先に変更があった場合は修正する必要があります。
- `codeRunner`
  - `async run(runnerId: string, sourceCode: string, input: string, expectedOutput: string | null, options: Options = { trim: true, split: true })`
    - コードを実行します。
    - `runnerId`: 使用する `runners` のキーを指定します。
    - `sourceCode`: 実行するプログラムのソースコードです。
    - `input`: プログラムに与える標準入力です。
    - `expectedOutput`: 期待される標準出力です。与えた場合、正誤判定します。
    - `options`: 実行時のオプションです。


## Options.ts

`Options` は `CodeRunner` に渡すオプションのフィールドです。

## Result.ts

`Result` は `CodeRunner` から返される結果のフィールドです。

## CodeRunner.ts

`CodeRunner` を定義しています。

## CustomRunner.ts

`CustomRunner` は、特殊な処理が必要だが、ファイルとしてくくりだすほどでもないような場合に使います。

## AtCoderRunner.ts

`AtCoderRunner` は、現在開いている問題ページと同じコンテストでのカスタムテストを使用します。

カスタムテストは並列で複数実行できないため、前に実行されたテストの終了を待ってから次のテストを実行します。

実行時、以前に `options.runGroupId` が同じコードで CE が出ていた場合は実行を省略します。

## PaizaIORunner

`PaizaIORunner` は [paiza.io](https://paiza.io/) にコードを送信して実行します。

API については [http://api.paiza.io/docs/swagger/#!/runners/] 、使える環境については [https://paiza.io/help] を参照。

## WandboxRunner

`WandboxRunner` は [Wandbox](https://wandbox.org/) にコードを送信して実行します。

API については [https://github.com/melpon/wandbox/blob/master/kennel/API.md] を参照。

## WandboxCppRunner

`WandboxCppRunner` は Wandbox で C++ を実行する場合に ACL を追加するためのもの。

ちなみになぜ paiza.io では追加していないかというと、 paiza.io はコード長制限が厳し目だから。

## brythonRunner.ts

`brythonRunner` は Python をブラウザで実行する。最初に実行されたときに brython を読み込む。

## pyodideRunner.ts

`pyodideRunner` は Python をブラウザで実行する。最初に実行されたときに pyodide を読み込む。

pyodide のほうが brython よりも速い。