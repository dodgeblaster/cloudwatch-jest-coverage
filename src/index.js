const util = require('./util')
module.exports.main = (req) => {
    return util.add(req.a, req.b)
}
