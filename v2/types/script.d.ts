declare interface AtCoderWindow extends Window {
  // atcoder.jp
  getSourceCode(): string;
  csrfToken: string;
  contestScreenName: string;
  $: any;

  // AtCoder Easy Test v2
  bottomMenu: {
    selectTab(tabId: string): void;
    addTab(tabId: string, tabLabel: string, paneContent: Node, options?: {}): any;
    show(): void;
    toggle(): void;
  };
  codeRunner: {
    run(languageId: string, sourceCode: string, input: string, expectedOutput: string | null, options: any): Promise<any>;
    getEnvironment(languageId: string): Promise<[string, string][]>;
  };
}

declare const unsafeWindow: AtCoderWindow;

declare function GM_getValue(key: string): string | null;
declare function GM_setValue(key: string, value: string): void;