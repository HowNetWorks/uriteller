if (process.env.NODE_ENV === "production") {
    require("@google/cloud-debug");
}

const url = require("url");
const path = require("path");
const moment = require("moment");
const crypto = require("crypto");
const express = require("express");
const exphbs = require("express-handlebars");
const gcloud = require("google-cloud")();

const datastore = gcloud.datastore();

function fullUrl(req, path) {
    let baseUrl = process.env.BASE_URL;
    return url.resolve(baseUrl, url.resolve(req.baseUrl, path));
}

function genId() {
    return crypto.randomBytes(15).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
}

function extractInfo(req) {
    return {
        remoteAddress: req.get("x-appengine-user-ip") || req.ip,
        userAgent: req.get("user-agent")
    };
}

function formatTimestamp(ts) {
    return moment(ts).format();
}

function create() {
    function tryCreate(transaction, resolve, reject) {
        const trap = genId();
        const view = genId();

        const trapKey = datastore.key(["Item", trap]);
        const viewKey = datastore.key(["Item", view]);

        transaction.get([trapKey, viewKey], (err, entities) => {
            if (err) {
                return transaction.rollback(_err => reject(_err || err));
            }

            if (entities.length > 0) {
                return tryCreate(transaction);
            }

            transaction.save([
                {
                    key: trapKey,
                    data: {
                        isView: false,
                        other: view
                    }
                },
                {
                    key: viewKey,
                    data: {
                        isView: true,
                        other: trap
                    }
                }
            ]);
            transaction.commit(err => err ? reject(err) : resolve(view));
        });
    }

    return new Promise((resolve, reject) => {
        const transaction = datastore.transaction();
        transaction.run(err => err ? reject(err) : tryCreate(transaction, resolve, reject));
    });
}

function get(id) {
    return new Promise((resolve, reject) => {
        datastore.get(datastore.key(["Item", id]), (err, entry) => {
            if (err) {
                reject(err);
            } else if (!entry) {
                resolve(null);
            } else {
                resolve(entry.data);
            }
        });
    });
}

function visit(target, timestamp, info) {
    return new Promise((resolve, reject) => {
        datastore.save({
            key: datastore.key(["Visit"]),
            data: {
                target: target,
                timestamp: timestamp,
                info: info
            }
        }, err => err ? reject(err) : resolve());
    });
}

function list(target) {
    return new Promise((resolve, reject) => {
        datastore.createQuery("Visit")
            .filter("target", target)
            .order("timestamp", {
                descending: true
            })
            .run((err, entities) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(entities.map(entity => {
                        const obj = Object.assign({}, entity.data);
                        delete obj.target;
                        return obj;
                    }));
                }
            });
    });
}

const app = express();

// By default the express-handlebars package searches ./views for view templates
// and ./views/layouts for layouts.
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.use("/assets", express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
    res.render("index", {
        styles: ["/assets/common.css"],
        scripts: ["/assets/common.js"]
    });
});

app.get("/new", (req, res) => {
    create()
        .then(view => {
            res.redirect("/" + view);
        })
        .catch(err => {
            console.error(err);
            res.sendStatus(500);
        });
});

app.get("/:id", (req, res) => {
    const id = req.params.id;

    get(id).then(item => {
        if (!item) {
            return res.sendStatus(404);
        }

        if (!item.isView) {
            const timestamp = Date.now();
            const info = extractInfo(req);
            return visit(id, timestamp, info).then(() => {
                res.send("This visit has been logged.");
            });
        }

        return list(item.other).then(entities => {
            res.render("visits", {
                styles: ["/assets/common.css", "/assets/visits.css"],
                scripts: ["/assets/common.js", "/assets/visits.js"],
                trapUrl: fullUrl(req, item.other),
                visits: entities.map(entity => {
                    return {
                        timestamp: formatTimestamp(entity.timestamp),
                        remoteAddress: entity.info.remoteAddress,
                        userAgent: entity.info.userAgent
                    };
                })
            });
        });
    }).catch(err => {
        console.error(err);
        res.sendStatus(500);
    });
});

const server = app.listen(process.env.PORT || 8080, () => {
    const addr = server.address();
    console.log("Listening on port %s...", addr.port);
});
