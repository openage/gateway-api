'use strict'

const workflowMapper = require('./workflow')

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }
    const model = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        status: entity.status,
        workflows: [],
        roles: []
    }

    if (entity.workflows) {
        model.workflows = entity.workflows.map(w => workflowMapper.toModel(w, context))
    }

    if (entity.roles) {
        model.roles = entity.roles.map(r => {
            return {
                code: r.code,
                name: r.name,
                permissions: r.permissions || []
            }
        })
    }

    return model
}

exports.toSummary = (entity) => {
    return {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        status: entity.status
    }
}
