'use strict'
const memberMapper = require('./member')
const userMapper = require('./user')
const taskMapper = require('./task')
const workflowStateMapper = require('./workflow-state')

exports.toModel = (entity, context) => {
    const model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,

        plan: {
            start: entity.plan.start,
            finish: entity.plan.finish
        },
        actual: {
            start: entity.actual.start,
            finish: entity.actual.finish
        },
        members: (entity.members || []).filter(m => m.status !== 'inactive').map(m => memberMapper.toModel(m, context)),
        isClosed: entity.isClosed
    }

    if (entity.approvers && entity.approvers.length) {
        model.approvers = entity.approvers.map(userMapper.toModel)
    } else {
        model.approvers = []
    }

    if (entity.project) {
        model.project = {
            id: entity.project.id,
            code: entity.project.code,
            name: entity.project.name
        }
    }

    if (entity.workflowType) {
        model.type = entity.workflowType.code
        model.name = entity.workflowType.name
        model.description = entity.workflowType.description
        model.estimatedDuration = entity.workflowType.estimatedDuration
    }

    if (entity.name) {
        model.name = entity.name
    }

    if (entity.description) {
        model.description = entity.description
    }

    if (entity.tasks && entity.tasks.length) {
        model.tasks = entity.tasks.map(taskMapper.toModel)
    }

    if (entity.states && entity.states.length) {
        model.states = entity.states.map(workflowStateMapper.toModel)
        model.status = model.states.find(i => i.isCurrent)
    }

    return model
}

exports.toSearchModel = (entities) => {
    return entities.map((entity) => {
        return exports.toModel(entity)
    })
}
