export function html2element(html: string): Node {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.firstChild;
}