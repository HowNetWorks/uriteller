const net = require("net");
const dns = require("dns");
const ipAddress = require("ip-address");

const OK_DNS_ERRORS = new Set([dns.NODATA, dns.NOTFOUND]);

exports.reverse = function(ip) {
    if (!net.isIP(ip)) {
        return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err) {
                return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
            }
            return resolve(hostnames);
        });
    });
};

exports.ipToASNs = function(ip) {
    if (net.isIP(ip)) {
        const ipv4 = new ipAddress.Address4(ip);
        if (ipv4.isValid()) {
            return lookup(ipv4.toArray().reverse().join(".") + ".origin.asn.cymru.com");
        }

        const ipv6 = new ipAddress.Address6(ip);
        if (ipv6.isValid()) {
            return lookup(ipv6.reverseForm({ omitSuffix: true }) + ".origin6.asn.cymru.com");
        }
    }
    return Promise.resolve([]);
};

function lookup(name) {
    return lookupASNs(name).then(asns => {
        return Promise.all(asns.map(lookupASInfo));
    });
}

function lookupASNs(name) {
    return new Promise((resolve, reject) => {
        dns.resolveTxt(name, (err, records) => {
            if (err) {
                return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
            }

            const asns = new Set();
            records.forEach(record => {
                const asn = record.join("").split("|")[0].trim();
                if (asn) {
                    asns.add(asn);
                }
            });
            return resolve(Array.from(asns));
        });
    });
}

function cleanASName(name) {
    // Remove a trailing two-character country code, if it exists. Also trim
    // away surrounding whitespace.
    return name.replace(/,\s*[A-Z]{2}\s*$/, "").trim();
}

function lookupASInfo(asn) {
    return new Promise((resolve, reject) => {
        dns.resolveTxt("AS" + asn + ".asn.cymru.com", (err, records) => {
            if (err) {
                return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
            }

            const names = new Set();
            records.forEach(record => {
                const pieces = record.join("").split("|");
                if (pieces.length < 5) {
                    return;
                }
                const name = cleanASName(pieces[4]);
                if (name) {
                    names.add(name);
                }
            });
            return resolve({
                asn: asn,
                names: Array.from(names)
            });
        });
    });
}
