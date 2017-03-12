import { errors } from "./lib/gcloud";

import fs from "fs";
import url from "url";
import path from "path";
import helmet from "helmet";
import express from "express";
import { createBundleRenderer } from "vue-server-renderer";

import * as taskQueue from "./lib/taskqueue";
import * as store from "./lib/store";
import Analytics from "./lib/analytics";
import bundle from "../../build/vue-ssr-bundle.json";

const renderer = createBundleRenderer(bundle, {
  template: fs.readFileSync(path.resolve(__dirname, "../../build/index.html")).toString()
});

function render(res, context) {
  return new Promise((resolve, reject) => {
    renderer.renderToString(context, (err, html) => {
      if (err) {
        reject(err);
      } else {
        res.send(html);
        resolve();
      }
    });
  });
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

const PAGE_ID_REGEX = /^\/([a-zA-Z0-9_-]{22})([./].*)?$/;

const analytics = new Analytics(process.env.GA_TRACKING_ID);

const app = express();
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

app.use(helmet());

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
        info: mergeAndClean(extractInfo(req), {
          protocol: req.secure ? "https" : "http",
          suffix: suffix || undefined
        })
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
app.use("/assets", express.static(path.join(__dirname, "../../build/assets"), { maxAge: "365d" }));

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
        return mergeAndClean(entity.info, {
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
            state: mergeAndClean(
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
