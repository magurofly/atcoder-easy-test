import Site from "./Site";

import init_AtCoder from "./atcoder";
import init_yukicoder from "./yukicoder";

export default Promise.any([init_AtCoder(), init_yukicoder()]);