import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export const create = React.createElement;

export default function render(element) {
    return "<!doctype html>" + renderToStaticMarkup(element);
}
