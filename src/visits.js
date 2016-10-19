import url from "url";
import Clipboard from "clipboard";
import "whatwg-fetch";

import "./common.css";
import "./visits.css";

function hookCopyPaste(element) {
    new Clipboard(element);
    element.disabled = false;
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

function col(row, text) {
    const element = document.createElement("td");
    if (text && text.trim()) {
        element.textContent = text.trim();
    } else {
        element.textContent = "\u00a0";
    }
    row.appendChild(element);
}

function updateTable(element, counts) {
    const baseUrl = element.dataset.updateUrl;
    const cursor = element.dataset.updateCursor;

    fetchUpdates(baseUrl, cursor, 1000, function(err, visits) {
        if (err) {
            console.error(err);
            return;
        }

        const body = element.tBodies[0];
        visits.forEach(visit => {
            const row = document.createElement("tr");
            col(row, visit.timestamp);
            col(row, (visit.country.emoji || "") + "\u00a0" + visit.ip);
            col(row, visit.asns.map(asn => {
                return asn.asn + " " + asn.names.join(", ");
            }).join("\n"));
            col(row, visit.userAgent);
            body.insertBefore(row, body.firstChild);
        });
        counts.textContent = body.children.length;
    });
}

hookCopyPaste(document.getElementById("trap-copy"));
updateTable(document.getElementById("visit-table"), document.getElementById("visit-count"));
