const crypto = require("crypto");
const gcloud = require("google-cloud")();

const datastore = gcloud.datastore();

function genId() {
    return crypto.randomBytes(15).toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
}

exports.create = function() {
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
};

exports.get = function(id) {
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
};

exports.visit = function(target, timestamp, info) {
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
};

exports.list = function(target) {
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
};
