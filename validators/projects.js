'use strict'
const service = require('../services/projects')

exports.canCreate = async (req) => {
    if (!req.body) {
        return 'invalid request'
    }

    if (!req.body.name) {
        return 'NAME_REQUIRED'
    }
    if (!req.body.code) {
        return 'CODE_REQUIRED'
    }
}

exports.canUpdate = async (req) => {
    if (!req.body) {
        return 'invalid request'
    }
}
