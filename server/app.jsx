import { errors } from "./lib/gcloud";

import fs from "fs";
import url from "url";
import path from "path";
import React from "react";
import express from "express";

import * as taskQueue from "./lib/taskqueue";
import * as store from "./lib/store";
import render from "./lib/render";

import Layout from "../lib/views/Layout";
import Trap from "../lib/views/Trap";
import Index from "../lib/views/Index";
import Visits from "../lib/views/Visits";
import EmbeddedJSON from "../lib/views/EmbeddedJSON";

function loadAssetMap() {
    const assetMapPath = path.join(__dirname, "../build/assets.json");
    return JSON.parse(fs.readFileSync(assetMapPath));
}

let assetMap = loadAssetMap();

function asset(name, kind) {
    if (process.env.NODE_ENV !== "production") {
        assetMap = loadAssetMap();
    }
    return url.resolve("/assets/", assetMap[name][kind]);
}

function fullUrl(req, path) {
    let baseUrl = process.env.BASE_URL;
    return url.resolve(baseUrl, url.resolve(req.baseUrl, path));
}

function mergeAndClean(...objs) {
    const result = {};
    objs.forEach(obj => {
        Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
                result[key] = obj[key];
            } else {
                delete result[key];
            }
        });
    });
    return result;
}

function extractInfo(req) {
    // Google App Engine passes in an approximate geolocation in header
    // "x-appengine-country" and uses code "ZZ" for unknown locations.
    let country = req.get("x-appengine-country");
    if (!country || country === "ZZ") {
        country = undefined;
    }

    return mergeAndClean({
        ip: req.get("x-appengine-user-ip") || req.ip,
        referrer: req.get("referrer"), // Express considers "referrer" and "referer" interchangeable
        country: country,
        userAgent: req.get("user-agent")
    });
}

const app = express();

app.set("json spaces", 2);

app.use("/assets", express.static(path.join(__dirname, "../build/assets"), { maxAge: "365d" }));

app.get("/", (req, res) => {
    const styles = [asset("common", "css")];
    const scripts = [asset("common", "js")];
    res.send(render(
        <Layout className="page-index" styles={styles} scripts={scripts}>
            <Index />
        </Layout>
    ));
});

app.get("/new", (req, res, next) => {
    store.create()
        .then(view => {
            res.redirect("/" + view);
        })
        .catch(next);
});

app.get("/:id.json", (req, res, next) => {
    const id = req.params.id;

    let cursor = req.query.cursor;
    if (Array.isArray(cursor)) {
        return res.sendStatus(400);
    } else if (cursor !== undefined) {
        cursor = Number(cursor);
    }

    store.get(id)
        .then(item => {
            if (!item || !item.isView) {
                return res.sendStatus(404);
            }

            return store.list(item.other, cursor).then(({ cursor, visits }) => {
                res.json({
                    cursor: cursor,
                    trapUrl: fullUrl(req, item.other),
                    visits: visits.map(entity => {
                        return mergeAndClean(entity.info, {
                            timestamp: entity.timestamp
                        });
                    })
                });
            });
        })
        .catch(next);
});

app.get("/:id", (req, res, next) => {
    const id = req.params.id;

    store.get(id)
        .then(item => {
            if (!item) {
                return res.sendStatus(404);
            }

            if (!item.isView) {
                return taskQueue.publish("main-topic", {
                    target: id,
                    timestamp: Date.now(),
                    info: extractInfo(req)
                }).then(() => {
                    const styles = [asset("common", "css")];
                    const scripts = [asset("common", "js")];
                    res.send(render(
                        <Layout className="page-trap" styles={styles} scripts={scripts}>
                            <Trap />
                        </Layout>
                    ));
                });
            }

            return store.list(item.other).then(({ cursor, visits }) => {
                const initialData = {
                    js: false,
                    trapUrl: fullUrl(req, item.other),
                    updateUrl: fullUrl(req, id + ".json"),
                    updateCursor: cursor,
                    visits: visits.map(entity => {
                        return mergeAndClean(entity.info, {
                            timestamp: entity.timestamp
                        });
                    })
                };

                const styles = [asset("common", "css"), asset("visits", "css")];
                const scripts = [asset("common", "js"), asset("visits", "js")];
                res.send(render(
                    <Layout className="page-monitor" styles={styles} scripts={scripts}>
                        <EmbeddedJSON id="initial-data" content={initialData} />
                        <Visits {...initialData} />
                    </Layout>
                ));
            });
        })
        .catch(next);
});

app.use(errors.express);

const server = app.listen(process.env.PORT || 8080, () => {
    const addr = server.address();
    console.log("Listening on port %s...", addr.port);
});
