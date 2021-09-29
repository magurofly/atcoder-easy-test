export function buildParams(data: { [key: string]: string }): string {
  return Object.entries(data).map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(value)).join("&");
}

export function sleep(ms: number): Promise<void> {
  return new Promise(done => setTimeout(done, ms));
}