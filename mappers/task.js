'use strict'
const userMapper = require('./user')
const stateMapper = require('./state')
const workflowMapper = require('./workflow')

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    const model = {
        id: entity.id,
        code: entity.code,
        type: entity.type,
        subject: entity.subject,
        description: entity.description,

        priority: entity.priority,
        size: entity.size,
        progress: entity.progress,
        order: entity.order,

        plan: {
            start: entity.plan.start || null,
            finish: entity.plan.finish || null
        },
        actual: {
            start: entity.actual.start || null,
            finish: entity.actual.finish || null
        },

        meta: entity.meta,
        assignee: userMapper.toSummary(entity.assignee, context),
        owner: userMapper.toSummary(entity.owner, context),

        isClosed: false
    }

    if (entity.project) {
        model.project = {
            id: entity.project.id,
            code: entity.project.code,
            name: entity.project.name
        }
    }

    if (entity.release) {
        model.release = {
            id: entity.release.id,
            code: entity.release.code,
            name: entity.release.name
        }
    }

    if (entity.sprint) {
        model.sprint = {
            id: entity.sprint.id,
            code: entity.sprint.code,
            name: entity.sprint.name
        }
    }

    if (entity.entity) {
        model.entity = {
            id: entity.entity.id,
            code: entity.entity.code,
            name: entity.entity.name,
            type: entity.entity.type
        }
    }

    if (entity.status) {
        model.status = stateMapper.toModel(entity.status, entity.workflow, context)
        model.isClosed = model.status.isFinal
    }

    if (entity.workflow) {
        model.workflow = workflowMapper.toModel(entity.workflow)
    }

    return model
}

exports.toSummary = (entity, context) => {
    if (!entity) {
        return
    }
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    const model = {
        id: entity.id,
        code: entity.code,
        type: entity.type,
        subject: entity.subject,
        description: entity.description,

        priority: entity.priority,
        size: entity.size,
        progress: entity.progress,
        order: entity.order,

        plan: {
            start: entity.plan.start || null,
            finish: entity.plan.finish || null
        },
        actual: {
            start: entity.actual.start || null,
            finish: entity.actual.finish || null
        },
        assignee: userMapper.toSummary(entity.assignee, context),
        owner: userMapper.toSummary(entity.owner, context),
        isClosed: entity.isClosed
    }

    if (entity.project) {
        model.project = {
            id: entity.project.id,
            code: entity.project.code,
            name: entity.project.name
        }
    }

    if (entity.release) {
        model.release = {
            id: entity.release.id,
            code: entity.release.code,
            name: entity.release.name
        }
    }

    if (entity.sprint) {
        model.sprint = {
            id: entity.sprint.id,
            code: entity.sprint.code,
            name: entity.sprint.name
        }
    }

    if (entity.entity) {
        model.entity = {
            id: entity.entity.id,
            code: entity.entity.code,
            name: entity.entity.name,
            type: entity.entity.type
        }
    }

    if (entity.status) {
        model.status = stateMapper.toModel(entity.status, entity.workflow)
        if (!model.isClosed) {
            model.isClosed = model.status.isFinal
        }
    }

    return model
}
