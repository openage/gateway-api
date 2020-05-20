const memberMapper = require('./member')
const typeMapper = require('./project-type')
const sprintMapper = require('./sprint')

exports.toModel = (entity, context) => {
    const model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        type: typeMapper.toModel(entity.type, context),
        members: [],
        plan: {
            start: entity.plan.start,
            finish: entity.plan.finish
        },
        actual: {
            start: entity.actual.start,
            finish: entity.actual.finish
        },
        sprints: [],
        isClosed: entity.isClosed
    }

    if (entity.members && entity.members.length) {
        model.members = entity.members.map(m => memberMapper.toModel(m, context))
    }

    if (entity.sprints && entity.sprints.length) {
        model.sprints = entity.sprints.map(i => sprintMapper.toModel(i, context))
    }

    model.sprints.push({
        id: 'backlog',
        code: 'backlog',
        name: 'Backlog',

        plan: {
            start: null,
            finish: null
        },
        actual: {
            start: null,
            finish: null
        },
        isClosed: false
    })

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
