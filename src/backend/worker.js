const { errors } = require("./lib/gcloud");
const net = require("net");
const { URL } = require("url");
const request = require("request");
const store = require("./lib/store");
const taskQueue = require("./lib/taskqueue");
const resolve = require("./lib/resolve");

const WHEREABOUTS_URL = process.env.WHEREABOUTS_URL || "http://localhost:8080";

function whereabouts(ip) {
  return new Promise((resolve, reject) => {
    if (!net.isIP(ip)) {
      return resolve(undefined);
    }

    const url = new URL("api/whereabouts/" + ip, WHEREABOUTS_URL).toString();
    return request({ url: String(url), json: true }, (err, res) => {
      if (err) {
        return reject(err);
      }

      const json = res.body;
      if (json && json.country && json.country.code) {
        return resolve(json.country.code);
      }
      resolve(undefined);
    });
  });
}

taskQueue.subscribe("trap-topic", "trap-subscription", (err, msg) => {
  if (err) {
    return errors.report(err);
  }

  const data = msg.data;
  if (!data.info || !data.info.ip) {
    return msg.ack();
  }

  const ip = data.info.ip;
  Promise.all([resolve.ipToASNs(ip), resolve.reverse(ip), whereabouts(ip)])
    .then(([asns, reverse, country]) => {
      data.info.reverse = reverse;
      data.info.asns = asns;
      data.info.country = country;
      return store.visit(data.target, data.timestamp, data.info);
    })
    .then(() => msg.ack())
    .catch(errors.report);
}).catch(errors.report);
