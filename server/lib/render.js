import { renderToStaticMarkup } from "react-dom/server";

export default function render(element) {
    return "<!doctype html>" + renderToStaticMarkup(element);
}
