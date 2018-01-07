
function toObject(arr) {
    const res = {}
    for (const [key, value] of arr) {
        res[key] = value
    }
    return res
}

function objectMap(object, keyMap = key => key, valueMap = value => value) {
    return Object.keys(object).reduce((o, key) => {
        o[keyMap(key)] = valueMap(object[key])
        return o
    }, {})
}

module.exports = {
    toObject,
    objectMap
}
