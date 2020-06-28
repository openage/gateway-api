const memberMapper = require('./member')
const typeMapper = require('./project-type')
const sprintMapper = require('./sprint')

exports.toModel = (entity, context) => {
    const model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        type: typeMapper.toModel(entity.type, context),
        plan: {
            start: entity.plan.start,
            finish: entity.plan.finish
        },
        actual: {
            start: entity.actual.start,
            finish: entity.actual.finish
        },
        sprints: [],
        members: (entity.members || []).filter(m => m.status !== 'inactive').map(m => memberMapper.toModel(m, context)),
        isClosed: entity.isClosed
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
