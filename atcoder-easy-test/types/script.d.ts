declare interface AtCoderWindow extends Window {
  getSourceCode(): string;
  csrfToken: string;
  $: any;
}

declare const unsafeWindow: AtCoderWindow;