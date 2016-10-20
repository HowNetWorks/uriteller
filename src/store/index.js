const crypto = require("crypto");
const gcloud = require("google-cloud")();

const datastore = gcloud.datastore();

// Return a string id with at least `n` bits of randomness. The returned string
// will contain only characters [a-zA-Z0-9_-].
function genId(n=128) {
    const bytes = crypto.randomBytes(Math.ceil(n / 8.0));
    return bytes.toString("base64").replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}

const seqIdCache = new Map();

function getSeqId(target) {
    const cached = seqIdCache.get(target);
    if (cached !== undefined) {
        return Promise.resolve(cached);
    }

    return querySeqId(target).then(seqId => {
        setSeqId(target, seqId);
        return seqId;
    });
}

function setSeqId(target, seqId) {
    const cached = seqIdCache.get(target);
    if (cached === undefined || cached < seqId) {
        seqIdCache.set(target, seqId);
    }
}

function querySeqId(target) {
    const query = datastore.createQuery("Visit")
        .filter("target", target)
        .select("seqId")
        .order("seqId", {
            descending: true
        })
        .limit(2);

    return doQuery(query).then(_entities => {
        const entities = _entities.filter(entity => {
            return entity.data.seqId !== undefined && !isNaN(entity.data.seqId);
        });
        if (entities.length === 0 || entities[0].data.seqId === undefined) {
            return 0;
        }
        return entities[0].data.seqId + 1;
    });
}

function seqIdKey(target, seqId) {
    return datastore.key(["Visit", seqId + "/" + target]);
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

function doQuery(query) {
    return new Promise((resolve, reject) => {
        query.run((err, entities) => {
            if (err) {
                reject(err);
            } else {
                resolve(entities);
            }
        });
    });
}

exports.visit = function(target, timestamp, info) {
    function insert(seqId, resolve, reject) {
        datastore.insert({
            key: seqIdKey(target, seqId),
            data: {
                seqId: seqId,
                target: target,
                timestamp: timestamp,
                info: info
            }
        }, err => {
            if (!err) {
                setSeqId(target, seqId + 1);
                resolve();
            } else if (err.code !== 409) {
                reject(err);
            } else {
                insert(seqId + 1, resolve, reject);
            }
        });
    }

    return getSeqId(target).then(seqId => {
        return new Promise((resolve, reject) => {
            insert(seqId, resolve, reject);
        });
    });
};

function getSeqIds(target, seqIds) {
    if (seqIds.length === 0) {
        return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
        const keys = seqIds.map(seqId => seqIdKey(target, seqId));
        datastore.get(keys, (err, entities) => {
            if (err) {
                return reject(err);
            }
            return resolve(entities);
        });
    });
}

exports.list = function(target, cursor=0) {
    let query = datastore.createQuery("Visit")
        .filter("target", target)
        .filter("seqId", ">=", cursor)
        .order("seqId", { descending: true });

    return doQuery(query)
        .then(entities => {
            return entities.filter(entity => {
                let seqId = entity.data.seqId;
                return seqId !== undefined & !isNaN(seqId);
            });
        })
        .then(entities => {
            const nextCursor = entities.reduce((previous, entity) => {
                let seqId = entity.data.seqId + 1;
                return seqId > previous ? seqId : previous;
            }, cursor);

            const available = new Set(entities.map(entity => entity.seqId));
            const missing = [];
            for (var i = cursor; i < nextCursor; i++) {
                if (available.has(i)) {
                    missing.push(i);
                }
            }

            return getSeqIds(missing).then(newEntities => {
                return {
                    cursor: nextCursor,
                    entities: newEntities.concat(entities).map(entity => {
                        const obj = Object.assign({}, entity.data);
                        delete obj.target;
                        return obj;
                    })
                };
            });
        });
};
