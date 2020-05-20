'use strict'
const memberMapper = require('./member')

exports.toModel = (state) => {
    let item = {
        id: state.id,
        plan: {
            start: state.plan.start,
            finish: state.plan.finish
        },
        actual: {
            start: state.actual.start,
            finish: state.actual.finish
        },
        isCurrent: state.isCurrent
    }

    if (state.members && state.members.length) {
        item.members = state.members.map(memberMapper.toModel)
    }

    if (state.type) {
        item.type = {
            id: state.type.id,
            code: state.type.code,
            name: state.type.name,
            estimatedDuration: state.type.estimatedDuration,
            isFirst: state.type.isFirst,
            isCancelled: state.type.isCancelled,
            isFinal: state.type.isFinal
        }
    }

    return item
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
