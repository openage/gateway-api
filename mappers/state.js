'use strict'
exports.toModel = (entity, workflow, context) => {
    var item = {
        code: entity.code,
        action: entity.action || entity.name,
        name: entity.name,
        icon: entity.icon,
        estimate: entity.estimate,
        isFirst: entity.isFirst,
        isPaused: entity.isPaused,
        isCancelled: entity.isCancelled,
        isFinal: entity.isFinal,
        hooks: {
            before: '',
            after: ''
        },
        next: []
    }

    if (entity.hooks) {
        item.hooks.before = entity.hooks.before
        item.hooks.after = entity.hooks.after
    }

    item.next = []

    for (const model of entity.next) {
        if (workflow) {
            workflow.states.forEach(s => {
                if (s.code == model) {
                    item.next.push({
                        code: s.code,
                        action: s.action,
                        name: s.name,
                        icon: s.icon,
                        estimate: s.estimate,
                        isFirst: s.isFirst,
                        isPaused: s.isPaused,
                        isCancelled: s.isCancelled,
                        isFinal: s.isFinal
                    })
                }
            })
        }
    }

    return item
}
