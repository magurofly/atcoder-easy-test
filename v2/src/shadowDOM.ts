const adoptedStyleSheets: CSSStyleSheet[] = [];
const shadowRootRefs = new Set<WeakRef<ShadowRoot>>();

export default {
    async loadCSS(url: string) {
        const css = await fetch(url).then(res => res.text());
        const styleSheet = await new CSSStyleSheet().replace(css);
        this.addStyleSheet(styleSheet);
    },
    addStyleSheet(styleSheet: CSSStyleSheet) {
       adoptedStyleSheets.push(styleSheet);
        for (const ref of shadowRootRefs) {
            const shadowRoot = ref.deref();
            if (!shadowRoot) {
                shadowRootRefs.delete(ref);
                continue;
            }
            shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
        }
    },
    wrap(...nodes: Node[]): HTMLElement {
        const root = document.createElement("span");
        root.appendChild(document.createElement("slot"));
        const shadowRoot = root.attachShadow({ mode: "open" });
        shadowRootRefs.add(new WeakRef(shadowRoot));
        shadowRoot.adoptedStyleSheets = adoptedStyleSheets;
        shadowRoot.append(...nodes);
        return root;
    }
};