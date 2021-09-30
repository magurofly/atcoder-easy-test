import Site from "./Site";

import atcoder from "./atcoder";
import yukicoder from "./yukicoder";

const site: Site | null = atcoder || yukicoder;

export default site;