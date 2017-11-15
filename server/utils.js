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

module.exports = {
    prepare,
    findOne,
    find,
}