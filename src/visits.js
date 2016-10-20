import url from "url";
import React from "react";
import { render } from "react-dom";
import "whatwg-fetch";

import Visits from "./views/Visits.jsx";
import "./common.css";
import "./visits.css";

function byTimestampDescending(left, right) {
    if (left.timestamp === right.timestamp) {
        return 0;
    }
    return left.timestamp < right.timestamp ? 1 : -1;
}

function timeout(delay) {
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

function fetchUpdates(baseUrl, cursor, interval, callback) {
    const parsedUrl = url.parse(baseUrl, true);
    parsedUrl.query.cursor = cursor;

    const updateUrl = url.format(parsedUrl);
    timeout(interval)
        .then(() => fetch(updateUrl))
        .then(response => response.json())
        .then(
            json => {
                const visits = json.visits;
                if (visits.length > 0) {
                    callback(null, visits);
                }
                fetchUpdates(baseUrl, json.cursor, interval, callback);
            },
            err => {
                callback(err, null);
            }
        );
}

function updateTable(_props, rootElement) {
    let props = _props;
    render(<Visits {...props} />, rootElement);

    const baseUrl = props.updateUrl;
    const cursor = props.updateCursor;
    fetchUpdates(baseUrl, cursor, 1000, function(err, visits) {
        if (err) {
            console.error(err);
            return;
        }

        props = Object.assign({}, props, {
            visits: props.visits.concat(visits).sort(byTimestampDescending)
        });
        render(<Visits {...props} />, rootElement);
    });
}

const initialData = JSON.parse(document.getElementById("initial-data").textContent);
const rootElement = document.getElementById("app");
updateTable(initialData, rootElement);
