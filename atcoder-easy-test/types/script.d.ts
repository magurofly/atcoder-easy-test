declare interface AtCoderWindow extends Window {
  getSourceCode(): string;
  csrfToken: string;
}

declare const unsafeWindow: AtCoderWindow;