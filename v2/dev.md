# AtCoder Easy Test の構造

- bottomMenu: 下メニュー。画面下部の^ボタンを押すと出てくるやつ
  - bottomMenu.html: 外観
  - style.html: 外観
  - bottomMenu.ts: 下メニューのインタフェース
  - BottomMenuTab.ts: タブのインタフェース
  - index.ts: 実装
- codeRunner: コードを実行したり、出力と想定解が同じかチェックする
- resultList: 提出ボタンの下部に表示される、AC AC ACみたいなやつ
- codeSaver: 前に実行したコードを保存する
- ResultTabContent: bottomMenuに表示される結果タブの内容
- testcase: 問題文からテストケースを取得する
- util: ユーティリティ