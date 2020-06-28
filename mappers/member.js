'use strict'

const userMapper = require('./user')

exports.toModel = (entity, context) => {
    return {
        user: userMapper.toModel(entity.user, context),
        size: entity.size || 0,
        burnt: entity.size || 0,
        time: entity.size || 0,
        roles: entity.roles || [],
        status: entity.status || 'active'
    }
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
