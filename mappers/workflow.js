'use strict'

const stateMapper = require('./state')

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    let item = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        meta: entity.meta,
        states: [],
        children: []
    }

    for (const state of entity.states) {
        item.states.push(stateMapper.toModel(state, entity, context))
    }

    if (entity.children && entity.children.length) {
        for (const child of entity.children) {
            if (child._bsontype === 'ObjectID') {
                item.children.push({
                    id: child.toString()
                })
            } else {
                item.children.push({
                    id: child.id,
                    code: child.code,
                    name: child.name,
                    meta: child.meta,
                    description: child.description,
                    states: [],
                    children: []
                })

                for (const state of child.states) {
                    item.states.push(stateMapper.toModel(state, child, context))
                }
            }
        }
    }

    return item
}

exports.toSearchModel = (entities, context) => {
    return entities.map((entity) => {
        return exports.toModel(entity, context)
    })
}
