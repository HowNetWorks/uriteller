const { errors } = require("./lib/gcloud");

const url = require("url");
const path = require("path");
const helmet = require("helmet");
const express = require("express");
const compression = require("compression");
const expressStaticGzip = require("express-static-gzip");
const { createBundleRenderer } = require("vue-server-renderer");

const taskQueue = require("./lib/taskqueue");
const store = require("./lib/store");
const Analytics = require("./lib/analytics");
const serverBundle = require("../../build/vue-ssr-server-bundle.json");
const clientManifest = require("../../build/vue-ssr-client-manifest.json");

const renderer = createBundleRenderer(serverBundle, {
  runInNewContext: "once",
  clientManifest,
  template: `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
        <link rel="icon" type="image/png" href="/favicon.png" />
        <title>URI:teller</title>
      </head>
      <body>
        <!--vue-ssr-outlet-->
      </body>
    </html>
  `
});

function render(res, context) {
  return new Promise((resolve, reject) => {
    const stream = renderer.renderToStream(context);
    stream.once("data", data => {
      res.set("Content-Type", "text/html");
      res.write(data);

      stream.on("data", data => {
        res.write(data);
      });
    });
    stream.on("end", () => {
      res.end();
      resolve();
    });
    stream.on("error", err => {
      reject(err);
    });
  });
}

function fullUrl(req, path) {
  const baseUrl = process.env.APP_BASE_URL;
  return url.resolve(baseUrl, url.resolve(req.baseUrl, path));
}

const PAGE_ID_REGEX = /^\/([a-zA-Z0-9_-]{22})([./].*)?$/;

const analytics = new Analytics(process.env.GA_TRACKING_ID);

const app = express();
app.set("json spaces", 2);
app.set("trust proxy", true);
app.use(helmet());
app.use(compression());

app.get("/healthz", (req, res) => {
  res.sendStatus(200);
});

app.get(PAGE_ID_REGEX, (req, res, next) => {
  const id = req.params[0];
  store.get(id)
    .then(item => {
      if (!item || item.isView) {
        return;
      }

      analytics.event(req, "trap", "view").catch(errors.report);

      const suffix = req.url.substring(1 + id.length) || undefined;
      return taskQueue.publish("trap-topic", {
        target: id,
        timestamp: Date.now(),
        info: {
          ip: req.ip,
          referrer: req.get("referrer"), // Express considers "referrer" and "referer" interchangeable
          userAgent: req.get("user-agent"),
          protocol: req.secure ? "https" : "http",
          suffix: suffix || undefined
        }
      });
    })
    .then(
      () => next(),
      err => next(err)
    );
});

app.use((req, res, next) => {
  if (req.secure) {
    next();
    return;
  }

  const redirect = fullUrl(req, req.path);
  const protocol = url.parse(redirect).protocol;
  if (protocol === "https:") {
    res.redirect(redirect);
  } else if (process.env.NODE_ENV !== "production" && protocol === "http:") {
    next();
  } else {
    next(new Error("can't decide how to redirect an insecure request"));
  }
});

app.use("/", express.static(path.join(__dirname, "../../static")));
app.use("/assets", expressStaticGzip(path.join(__dirname, "../../build/assets"), { maxAge: "365d" }));

app.get("/", (req, res, next) => {
  analytics.pageView(req).catch(errors.report);
  render(res, { view: "index" }).catch(next);
});

app.get("/new", (req, res, next) => {
  analytics.pageView(req).catch(errors.report);

  store.create()
    .then(view => {
      res.redirect(fullUrl(req, view));
    })
    .catch(next);
});

function getData(req, target, cursor) {
  return store.list(target, cursor).then(({ cursor, visits }) => {
    return {
      trapUrl: fullUrl(req, target),
      cursor: cursor,
      visits: visits.map(entity => {
        return Object.assign({}, entity.info, {
          protocol: entity.info.protocol || "https",
          timestamp: entity.timestamp
        });
      })
    };
  });
}

app.get(PAGE_ID_REGEX, (req, res, next) => {
  const id = req.params[0];
  const rest = req.params[1];

  store.get(id)
    .then(item => {
      if (item && !item.isView) {
        res.status(404);
        render(res, {
          view: "trap",
          state: { baseUrl: fullUrl(req, "/") }
        });
      }

      if (item && item.isView && !rest) {
        analytics.pageView(req).catch(errors.report);
        return getData(req, item.other).then(data => {
          render(res, {
            view: "monitor",
            state: Object.assign(
              {
                updateUrl: fullUrl(req, id + ".json")
              },
              data
            )
          });
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

  // eslint-disable-next-line no-console
  console.log("Listening on port %s...", addr.port);
});
