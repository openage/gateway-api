'use strict'

const hookMapper = require('./hook')

exports.toModel = (entity, workflow, context) => {
    var item = {
        code: entity.code,
        action: entity.action || entity.name,
        name: entity.name,
        label: entity.label,
        icon: entity.icon,
        estimate: entity.estimate,
        isFirst: entity.isFirst,
        isPaused: entity.isPaused,
        isCancelled: entity.isCancelled,
        isFinal: entity.isFinal,
        permissions: entity.permissions || [],
        hooks: hookMapper.toModel(entity.hooks, context),
        date: entity.date,
        next: []
    }

    item.next = []

    if (entity.next) {
        for (const model of entity.next) {
            if (workflow && workflow.states) {
                workflow.states.forEach(s => {
                    if (s.code === model) {
                        item.next.push({
                            code: s.code,
                            action: s.action,
                            name: s.name,
                            icon: s.icon,
                            label: s.label,
                            estimate: s.estimate,
                            isFirst: s.isFirst,
                            isPaused: s.isPaused,
                            isCancelled: s.isCancelled,
                            isFinal: s.isFinal,
                            date: s.date,
                            hooks: hookMapper.toModel(s.hooks, context),
                            permissions: s.permissions || []
                        })
                    }
                })
            }
        }
    }

    return item
}
