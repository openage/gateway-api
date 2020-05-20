const sendIt = require('@open-age/send-it-client')
const users = require('../../../../services/users')
const taskMapper = require('../../../../mappers/task')

exports.process = async (entity, context) => {
    const assignee = await users.get(entity.assignee, context)

    if (assignee.id === context.user.id) {
        context.logger.debug('skipping message: self assigned')
    }

    let model = taskMapper.toModel(entity, context)

    await sendIt.dispatch({
        data: {
            task: model
        },
        meta: {
            entity: { // when this message is clicked, the task detail should open
                id: model.id,
                type: 'task'
            }
        },
        template: {
            code: 'gateway-task-assigned'
        },
        to: {
            role: { id: assignee.role.id }
        },
        options: {
            priority: 'high',
            modes: { push: true, email: true }
        }
    }, context)
}
