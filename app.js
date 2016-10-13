const crypto = require("crypto");
const express = require("express");
const exphbs = require("express-handlebars");

function genId(map) {
    for (;;) {
        const name = crypto.randomBytes(32).toString("hex");
        if (!map.has(name)) {
            return name;
        }
    }
}

function visitInfo(req) {
    return {
        "address": req.connection.remoteAddress,
        "headers": req.headers
    };
}

const map = new Map();

const app = express();
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

app.get("/", (req, res) => {
    res.render("index", {
        "name": "World"
    });
});

app.get("/new", (req, res) => {
    const item = {
        "trap": null,
        "view": null,
        "visits": []
    };

    item.trap = genId(map);
    map.set(item.trap, item);

    item.view = genId(map);
    map.set(item.view, item);

    res.redirect("/" + item.view);
});

app.get("/:id", (req, res) => {
    const id = req.params.id;
    const item = map.get(id);

    if (item === undefined) {
        res.sendStatus(404);
    } else if (item.trap === id) {
        item.visits.push(visitInfo(req));
        res.sendStatus(200);
    } else if (item.view === id) {
        res.render("visits", {
            "trap": item.trap,
            "json": JSON.stringify(item.visits, null, 4)
        });
    } else {
        throw new Error("inconsistent map");
    }
});

const server = app.listen(process.env.PORT || 8080, () => {
    const addr = server.address();
    console.log("Listening on port " + addr.port + "...");
});
