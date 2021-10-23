import init_AtCoder from "./atcoder";
import init_yukicoder from "./yukicoder";
import init_Codeforces from "./codeforces";
import settings from "../settings";
import config from "../config";

const inits = [];

settings.registerFlag("site.atcoder", true, "Use AtCoder Easy Test in AtCoder");
if (config.get("site.atcoder", true)) inits.push(init_AtCoder());

settings.registerFlag("site.yukicoder", true, "Use AtCoder Easy Test in yukicoder");
if (config.get("site.yukicoder", true)) inits.push(init_yukicoder());

settings.registerFlag("site.codeforces", true, "Use AtCoder Easy Test in Codeforces");
if (config.get("site.codeforces", true)) inits.push(init_Codeforces());

export default Promise.any(inits);
