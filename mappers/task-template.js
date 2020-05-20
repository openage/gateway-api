'use strict'
const workflowMapper = require('./workflow')

exports.toModel = (entity, context) => {
    return {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        type: entity.type,
        subject: entity.subject,
        description: entity.description,

        priority: entity.priority,
        size: entity.size,
        assignee: entity.assignee,
        hooks: entity.hooks || [],
        workflow: workflowMapper.toModel(entity.workflow, context),
        children: entity.children ? entity.children.map(c => this.toSummary(c, context)) : []
    }
}

exports.toSummary = (entity, context) => {
    return {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        type: entity.type,
        subject: entity.subject,
        description: entity.description,

        priority: entity.priority,
        size: entity.size,
        assignee: entity.assignee,
        workflow: workflowMapper.toModel(entity.workflow, context)
    }
}
