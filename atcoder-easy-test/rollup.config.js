import typescript from "rollup-plugin-typescript";
import html from "rollup-plugin-html";
import packageJson from "./package.json";

export default [
    {
        input: "src/index.ts",
        output: {
            banner: `
// ==UserScript==
// @name        AtCoder Easy Test
// @namespace   https://atcoder.jp/
// @version     ${packageJson.version}
// @description ${packageJson.description}
// @author      ${packageJson.author}
// @license     ${packageJson.license}
// @supportURL  ${packageJson.bugs.url}
// @match       https://atcoder.jp/contests/*/tasks/*
// @grant       unsafeWindow
// ==/UserScript==
(function() {
                `.trim(),
            footer: `
})();
                `.trim(),
            file: "atcoder-easy-test.user.js",
        },
        plugins: [
            html({
                include: "**/*.html"
            }),
            typescript(),
        ]
    }
];