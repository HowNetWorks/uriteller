const dns = require("dns");
const ipAddress = require("ip-address");

const OK_DNS_ERRORS = new Set([dns.NODATA, dns.NOTFOUND]);

exports.reverse = function(ip) {
    return new Promise((resolve, reject) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err) {
                return OK_DNS_ERRORS.has(err.code) ? resolve([]) : reject(err);
            }
            return resolve(hostnames);
        });
    });
};

exports.ipToASNs = function(value) {
    const ipv4 = new ipAddress.Address4(value);
    if (ipv4.isValid()) {
        return lookup(ipv4.toArray().reverse().join(".") + ".origin.asn.cymru.com");
    }

    const ipv6 = new ipAddress.Address6(value);
    if (ipv6.isValid()) {
        return lookup(ipv6.reverseForm({ omitSuffix: true }) + ".origin6.asn.cymru.com");
    }

    return Promise.resolve(null);
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
                const name = pieces[4].trim();
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
