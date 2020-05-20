'use strict'

const taskStatusMapper = require('./state')

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
        isClosed: entity.isClosed
    }

    if (entity.tasks && entity.tasks.length) {
        model.tasks = entity.tasks.map((t) => {
            return {
                id: t.id,
                code: t.code,
                type: t.type,
                subject: t.subject,
                description: t.description,

                order: entity.order,
                priority: entity.priority,
                size: entity.size,
                progress: entity.progress,

                status: taskStatusMapper.toModel(entity.status)
            }
        })
    }

    return model
}
