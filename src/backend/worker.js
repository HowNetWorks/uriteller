import { errors } from "./lib/gcloud";

import * as store from "./lib/store";
import * as taskQueue from "./lib/taskqueue";
import * as resolve from "./lib/resolve";

taskQueue.subscribe("trap-topic", "trap-subscription", (err, msg) => {
  if (err) {
    return errors.report(err);
  }

  const data = msg.data;
  if (!data.info || !data.info.ip) {
    return msg.ack();
  }

  const ip = data.info.ip;
  Promise.all([resolve.ipToASNs(ip), resolve.reverse(ip)])
    .then(([asns, reverse]) => {
      data.info.reverse = reverse;
      data.info.asns = asns;
      return store.visit(data.target, data.timestamp, data.info);
    })
    .then(() => msg.ack())
    .catch(errors.report);
}).catch(errors.report);
