import typescript from "rollup-plugin-typescript";
import html from "rollup-plugin-html";
import jscc from 'rollup-plugin-jscc';
import packageJson from "./package.json";

export default [
    {
        input: "src/index.ts",
        output: {
            banner: `
// ==UserScript==
// @name        AtCoder Easy Test v2
// @namespace   https://atcoder.jp/
// @version     ${packageJson.version}
// @description ${packageJson.description}
// @author      ${packageJson.author}
// @license     ${packageJson.license}
// @supportURL  ${packageJson.bugs.url}
// @match       https://atcoder.jp/contests/*/tasks/*
// @match       https://yukicoder.me/problems/no/*
// @match       http://codeforces.com/contest/*/problem/*
// @match       http://codeforces.com/gym/*/problem/*
// @match       http://codeforces.com/problemset/problem/*
// @match       http://codeforces.com/group/*/contest/*/problem/*
// @match       http://*.contest.codeforces.com/group/*/contest/*/problem/*
// @match       https://codeforces.com/contest/*/problem/*
// @match       https://codeforces.com/gym/*/problem/*
// @match       https://codeforces.com/problemset/problem/*
// @match       https://codeforces.com/group/*/contest/*/problem/*
// @match       https://*.contest.codeforces.com/group/*/contest/*/problem/*
// @match       https://greasyfork.org/*/scripts/433152-atcoder-easy-test-v2
// @grant       unsafeWindow
// @grant       GM_getValue
// @grant       GM_setValue
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
            jscc({
                values: {
                    _ATCODER_EASY_TEST_VERSION: packageJson.version,
                }
            }),
        ]
    }
];