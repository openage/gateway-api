'use strict'

const webHook = require('../../../../helpers/web-hook')

exports.process = async (entity, context) => {
    if (entity.toJson) {
        entity = entity.toJson()
    } else if (entity.toObject) {
        entity = entity.toObject()
    }
    entity.status = entity.workflow.states.find(item => item.code == entity.status.code)
    await webHook.send({
        entity: 'task',
        action: 'create',
        when: 'after'
    }, entity, context)
}
