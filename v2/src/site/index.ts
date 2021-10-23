import Site from "./Site";

import init_AtCoder from "./atcoder";
import init_yukicoder from "./yukicoder";
import init_Codeforces from "./codeforces";

export default Promise.any([init_AtCoder(), init_yukicoder(), init_Codeforces()]);
