function prepare(o) {
    if (o && o._id) {
        o._id = o._id.toString()
    }
    return o
}

async function findOne(Collection, ...args) {
    return prepare(await Collection.findOne(...args))
}

async function find(Collection, ...args) {
    return (await Collection.find(...args).toArray()).map(prepare)
}

async function sleep (millis) {
    return new Promise((resolve) => setTimeout(resolve, millis))
}

module.exports = {
    prepare,
    findOne,
    find,
    sleep,
}