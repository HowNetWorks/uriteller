import url from "url";
import React from "react";
import { render } from "react-dom";

import Visits from "../lib/views/Visits.jsx";
import "./common.scss";
import "./visits.scss";

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

class ConnectionFailed extends Error {}
class RequestFailed extends Error {}
class ParsingFailed extends Error {}
class Timeout extends Error {}

function fetchJSON(url, timeout=15000) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.timeout = timeout;

        xhr.addEventListener("load", () => {
            if (xhr.status !== 200) {
                return reject(new RequestFailed(`status ${xhr.status} (${xhr.statusText})`));
            }

            const response = xhr.response;
            let json;
            try {
                json = JSON.parse(response);
            } catch (err) {
                return reject(new ParsingFailed("parsing the request response failed"));
            }
            resolve(json);
        }, false);

        xhr.addEventListener("error", () => {
            reject(new ConnectionFailed("connection failed"));
        }, false);

        xhr.addEventListener("timeout", () => {
            reject(new Timeout("timeout"));
        }, false);

        xhr.send();
    });
}

function fetchUpdates(baseUrl, cursor, interval, minInterval, maxInterval, callback) {
    const parsedUrl = url.parse(baseUrl, true);
    parsedUrl.query.cursor = cursor;

    const updateUrl = url.format(parsedUrl);
    timeout(interval)
        .then(() => fetchJSON(updateUrl))
        .then(
            json => {
                const visits = json.visits;
                if (visits.length > 0) {
                    callback(null, visits);
                }
                fetchUpdates(baseUrl, json.cursor, minInterval, minInterval, maxInterval, callback);
            },
            err => {
                callback(err, null);

                const newInterval = Math.min(interval * 2, maxInterval);
                fetchUpdates(baseUrl, cursor, newInterval, minInterval, maxInterval, callback);
            }
        );
}

function updateTable(_props, rootElement, minInterval=1000, maxInterval=15000) {
    let props = _props;
    render(<Visits {...props} />, rootElement);

    const baseUrl = props.updateUrl;
    const cursor = props.updateCursor;
    fetchUpdates(baseUrl, cursor, minInterval, minInterval, maxInterval, (err, visits) => {
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
updateTable({ ...initialData, js: true }, rootElement);
