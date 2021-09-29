declare interface AtCoderWindow extends Window {
  getSourceCode(): string;
  csrfToken: string;
  $: any;
  bottomMenu: {
    selectTab(tabId: string): void;
    addTab(tabId: string, tabLabel: string, paneContent: Node, options?: {}): any;
    show(): void;
    toggle(): void;
  };
  codeRunner: {
    run(languageId: string, index: number, sourceCode: string, input: string, expectedOutput: string | null, options: any): Promise<any>;
    getEnvironment(languageId: string): Promise<string[]>;
  };
}

declare const unsafeWindow: AtCoderWindow;