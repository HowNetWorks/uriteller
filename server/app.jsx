import { errors } from "./lib/gcloud";

import fs from "fs";
import url from "url";
import path from "path";
import React from "react";
import helmet from "helmet";
import express from "express";

import * as taskQueue from "./lib/taskqueue";
import * as store from "./lib/store";
import render from "./lib/render";
import Analytics from "./lib/analytics";

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
    const baseUrl = process.env.APP_BASE_URL;
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
        ip: req.ip,
        referrer: req.get("referrer"), // Express considers "referrer" and "referer" interchangeable
        country: country,
        userAgent: req.get("user-agent")
    });
}

const analytics = new Analytics(process.env.GA_TRACKING_ID);

const app = express();
app.use(helmet());
app.set("json spaces", 2);
app.set("trust proxy", true);

// Fix x-forwarded-for and x-forwarded-proto for App Engine Flexible.
app.use((req, res, next) => {
    const https = req.get("x-appengine-https");
    if (https) {
        req.headers["x-forwarded-proto"] = https.toLowerCase() === "on" ? "https" : "http";
    }

    const ip = req.get("x-appengine-user-ip");
    if (ip) {
        req.headers["x-forwarded-for"] = ip;
    }

    next();
});

app.use("/", express.static(path.join(__dirname, "../static")));

app.use("/assets", express.static(path.join(__dirname, "../build/assets"), { maxAge: "365d" }));

app.get("/", (req, res) => {
    analytics.pageView(req).catch(errors.report);

    const styles = [asset("common", "css")];
    const scripts = [asset("common", "js")];
    res.send(render(
        <Layout title="URI:teller" className="page-index" styles={styles} scripts={scripts}>
            <Index />
        </Layout>
    ));
});

app.get("/new", (req, res, next) => {
    analytics.pageView(req).catch(errors.report);

    store.create()
        .then(view => {
            res.redirect("/" + view);
        })
        .catch(next);
});

function getData(req, target, cursor) {
    return store.list(target, cursor).then(({ cursor, visits }) => {
        return {
            trapUrl: fullUrl(req, target),
            cursor: cursor,
            visits: visits.map(entity => {
                return mergeAndClean(entity.info, {
                    timestamp: entity.timestamp
                });
            })
        };
    });
}

app.get(/^\/([a-zA-Z0-9_-]{22})([./].*)?$/, (req, res, next) => {
    const id = req.params[0];
    const rest = req.params[1];

    store.get(id)
        .then(item => {
            if (item && !item.isView) {
                analytics.event(req, "trap", "view").catch(errors.report);

                const suffix = req.url.substring(1 + id.length) || undefined;
                return taskQueue.publish("trap-topic", {
                    target: id,
                    timestamp: Date.now(),
                    info: mergeAndClean(extractInfo(req), {
                        suffix: suffix || undefined
                    })
                }).then(() => {
                    const styles = [asset("common", "css")];
                    const scripts = [asset("common", "js")];
                    res.status(404).send(render(
                        <Layout title="URI:teller trap" className="page-trap" styles={styles} scripts={scripts}>
                            <Trap />
                        </Layout>
                    ));
                });
            }

            if (item && item.isView && !rest) {
                analytics.pageView(req).catch(errors.report);

                return getData(req, item.other).then(data => {
                    const initialData = mergeAndClean({
                        js: false,
                        updateUrl: fullUrl(req, id + ".json")
                    }, data);

                    const styles = [asset("common", "css"), asset("visits", "css")];
                    const scripts = [asset("common", "js"), asset("visits", "js")];
                    res.send(render(
                        <Layout title="URI:teller monitor" className="page-monitor" styles={styles} scripts={scripts}>
                            <EmbeddedJSON id="initial-data" content={initialData} />
                            <Visits {...initialData} />
                        </Layout>
                    ));
                });
            }

            if (item && item.isView && rest === ".json") {
                let cursor = req.query.cursor;
                if (Array.isArray(cursor)) {
                    return res.sendStatus(400);
                }
                if (cursor !== undefined) {
                    cursor = Number(cursor);
                }
                return getData(req, item.other, cursor).then(data => res.json(data));
            }

            next();
        })
        .catch(next);
});


app.use(errors.express);

const server = app.listen(process.env.PORT || 8080, () => {
    const addr = server.address();
    console.log("Listening on port %s...", addr.port);
});
