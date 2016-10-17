import Clipboard from "clipboard";

import "./common.css";
import "./visits.css";

const element = document.getElementById("trap-copy");
new Clipboard(element);
element.disabled = false;
