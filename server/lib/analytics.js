import net from "net";
import https from "https";
import crypto from "crypto";
import querystring from "querystring";
import ipAddress from "ip-address";
import request from "request";

function clean(obj) {
    const result = {};

    Object.keys(obj).forEach(key => {
        if (obj[key]) {
            result[key] = obj[key];
        }
    });

    return result;
}

function anonymizeIP(ip) {
    if (net.isIP(ip)) {
        const ipv4 = new ipAddress.Address4(ip + "/24");
        if (ipv4.isValid()) {
            return ipv4.startAddress().correctForm();
        }

        const ipv6 = new ipAddress.Address6(ip + "/48");
        if (ipv6.isValid()) {
            return ipv6.startAddress().correctForm();
        }
    }
    return void 0;
}

export default class {
    constructor(trackingId) {
        this._trackingId = trackingId;
        this._timeout = 1000;

        // Maximum number of measurements to fit into one batch. Google's
        // Measurement protocol limits this to 20.
        this._maxBatchLength = 20;
        // Maximum number of batches to keep in the buffer.
        this._maxBatchBufferLength = 50;
        this._batchBuffer = [];
        this._currentBatch = null;

        this._agent = new https.Agent({
            keepAlive: true,
            maxSockets: 1
        });
    }

    _request() {
        if (this._currentBatch !== null) {
            return;
        }
        if (this._batchBuffer.length === 0) {
            return;
        }

        this._currentBatch = this._batchBuffer.shift();

        const body = this._currentBatch.map(item => {
            return querystring.stringify(item.data);
        }).join("\n") + "\n";

        request.post("https://www.google-analytics.com/batch", {
            body: body,
            agent: this._agent,
            timeout: this._timeout
        }, (err, res) => {
            const batch = this._currentBatch;
            this._currentBatch = null;

            if (err) {
                batch.forEach(item => {
                    item.reject(err);
                });
            } else if (res.statusCode !== 200) {
                batch.forEach(item => {
                    item.reject(new Error(`Analytics request status ${res.statusCode}`));
                });
            } else {
                batch.forEach(item => {
                    item.resolve();
                });
            }

            this._request();
        });
    }

    _push(item) {
        if (this._batchBuffer.length === 0) {
            this._batchBuffer.push([]);
        }

        const lastBatch = this._batchBuffer[this._batchBuffer.length - 1];
        if (lastBatch.length < this._maxBatchLength) {
            lastBatch.push(item);
        } else {
            this._batchBuffer.push([item]);
        }

        if (this._batchBuffer.length > this._maxBatchBufferLength) {
            const dropped = this._batchBuffer.splice(0, this._batchBuffer.length - this._maxBatchBufferLength);
            dropped.forEach(item => {
                item.reject(new Error("Dropped"));
            });
        }

        this._request();
    }

    _send(req, ...overrides) {
        if (!this._trackingId) {
            return Promise.resolve();
        }

        const ip = anonymizeIP(req.ip);
        const ua = req.get("user-agent");
        const cid = crypto.createHash("sha256").update(ip + ua).digest("hex");

        const data = clean({
            v: "1",
            tid: this._trackingId,
            cid: cid,

            dh: req.hostname,
            dp: req.path,
            dr: req.get("referrer"), // Express considers "referrer" and "referer" interchangeable
            uip: ip,
            aip: "1",
            ua: ua,

            ...overrides
        });

        return new Promise((resolve, reject) => {
            this._push({
                data: data,
                resolve: resolve,
                reject: reject
            });
        });
    }

    pageView(req) {
        return this._send(req, {
            t: "pageview"
        });
    }

    event(req, category, action, label, value) {
        return this._send(req, {
            t: "event",
            ec: category,
            ea: action,
            el: label,
            ev: value
        });
    }
}
