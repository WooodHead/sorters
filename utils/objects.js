
function objectMap(object, keyMap = key => key, valueMap = value => value) {
    return Object.keys(object).reduce((o, key) => {
        o[keyMap(key)] = valueMap(object[key])
        return o
    }, {})
}

module.exports = {
    objectMap
}