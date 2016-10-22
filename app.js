if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = process.env.GAE_LONG_APP_ID;
}

if (process.env.NODE_ENV === "production") {
    require("@google/cloud-debug");
    require("@google/cloud-trace").start();
}

require("babel-register");

const url = require("url");
const path = require("path");
const moment = require("moment");
const express = require("express");
const emojiFlags = require("emoji-flags");

const taskQueue = require("./taskqueue");
const store = require("./src/store");
const assets = require("./build/assets.json");

const { default: render, create } = require("./src/views/render");
const { default: Layout } = require("./src/views/Layout");
const { default: Index } = require("./src/views/Index");
const { default: Visits } = require("./src/views/Visits");
const { default: EmbeddedJSON } = require("./src/views/EmbeddedJSON");

function asset(name, kind) {
    return url.resolve("/assets/", assets[name][kind]);
}

function fullUrl(req, path) {
    let baseUrl = process.env.BASE_URL;
    return url.resolve(baseUrl, url.resolve(req.baseUrl, path));
}

function getCountry(code) {
    const info = code ? emojiFlags.countryCode(code) : undefined;
    if (!info) {
        return {
            code: code
        };
    }
    return {
        code: code,
        name: info.name,
        emoji: info.emoji
    };
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

function formatTimestamp(ts) {
    return moment(ts).format();
}

const app = express();

app.set("json spaces", 2);

app.use("/assets", express.static(path.join(__dirname, "build/assets"), { maxAge: "365d" }));

app.get("/", (req, res) => {
    res.send(render(create(
        Layout, {
            styles: [asset("common", "css")],
            scripts: [asset("common", "js")]
        },
        create(Index)
    )));
});

app.get("/new", (req, res) => {
    store.create()
        .then(view => {
            res.redirect("/" + view);
        })
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

app.get("/:id.json", (req, res) => {
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
                            country: getCountry(entity.info.country),
                            timestamp: formatTimestamp(entity.timestamp)
                        });
                    })
                });
            });
        })
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

app.get("/:id", (req, res) => {
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
                    res.send("This visit has been logged.");
                });
            }

            return store.list(item.other).then(({ cursor, visits }) => {
                const initialData = {
                    trapUrl: fullUrl(req, item.other),
                    updateUrl: fullUrl(req, id + ".json"),
                    updateCursor: cursor,
                    visits: visits.map(entity => {
                        return mergeAndClean(entity.info, {
                            timestamp: formatTimestamp(entity.timestamp),
                            country: getCountry(entity.info.country)
                        });
                    })
                };

                res.send(render(create(
                    Layout, {
                        styles: [asset("common", "css"), asset("visits", "css")],
                        scripts: [asset("common", "js"), asset("visits", "js")]
                    },
                    create(EmbeddedJSON, {id: "initial-data", content: initialData}),
                    create(Visits, initialData)
                )));
            });
        })
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

const server = app.listen(process.env.PORT || 8080, () => {
    const addr = server.address();
    console.log("Listening on port %s...", addr.port);
});
