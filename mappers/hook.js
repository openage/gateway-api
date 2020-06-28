exports.toModel = (items, context) => {
    if (!items || !items.length) {
        return []
    }

    return items.map(t => {
        return {
            trigger: {
                when: t.trigger.when || 'after'
            },
            actions: t.actions.map(a => {
                return {
                    handler: a.handler || 'backend',
                    type: a.type || 'http',
                    config: a.config || {}
                }
            })
        }
    })
}
