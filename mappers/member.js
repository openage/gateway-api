'use strict'

const userMapper = require('./user')

exports.toModel = (entity) => {
    const model = {
        id: entity.id,
        role: entity.role,
        status: entity.status
    }

    if (entity.user) {
        model.user = userMapper.toModel(entity.user)
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
