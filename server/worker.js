import "./lib/gcloud";

import express from "express";
import * as store from "./lib/store";
import * as taskQueue from "./lib/taskqueue";
import * as resolve from "./lib/resolve";

const app = express();

app.get("/_ah/health", (req, res) => {
    res.sendStatus(200);
});

const server = app.listen(process.env.PORT || 8081, () => {
    const addr = server.address();
    console.log("Listening on port %s...", addr.port);
});

taskQueue.subscribe("main-topic", "main-subscription", (err, msg) => {
    if (err) {
        return console.error(err);
    }

    const data = msg.data;
    const ip = data.info.ip;
    Promise.all([resolve.ipToASNs(ip),  resolve.reverse(ip)])
        .then(([asns, reverse]) => {
            data.info.reverse = reverse;
            data.info.asns = asns;
            return store.visit(data.target, data.timestamp, data.info);
        })
        .then(() => msg.ack())
        .catch(err => console.error(err));
});
