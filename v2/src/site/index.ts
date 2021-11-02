import init_AtCoder from "./atcoder";
import init_yukicoder from "./yukicoder";
import init_Codeforces from "./codeforces";
import init_CodeforcesMobile from "./codeforces-mobile";
import init_config from "./about";
import config from "../config";

// 設定ページが開けなくなるのを避ける
const inits = [init_config()];

config.registerFlag("site.atcoder", true, "Use AtCoder Easy Test in AtCoder");
if (config.get("site.atcoder", true)) inits.push(init_AtCoder());

config.registerFlag("site.yukicoder", true, "Use AtCoder Easy Test in yukicoder");
if (config.get("site.yukicoder", true)) inits.push(init_yukicoder());

config.registerFlag("site.codeforces", true, "Use AtCoder Easy Test in Codeforces");
if (config.get("site.codeforces", true)) inits.push(init_Codeforces());

config.registerFlag("site.codeforcesMobile", true, "Use AtCoder Easy Test in Codeforces Mobile (m[1-3].codeforces.com)");
if (config.get("site.codeforcesMobile", true)) inits.push(init_CodeforcesMobile());

export default Promise.any(inits);
