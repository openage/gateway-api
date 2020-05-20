'use strict'

const templateHelper = require('../../helpers/template')
const client = new (require('node-rest-client-promise')).Client()
const templates = require('../../services/task-templates')

const getHook = (status, template) => {
    let result
    template.hooks.forEach(hook => {
        if (hook.status == status) {
            result = hook
        }
    })
    return result
}

const buildHeader = (task, hook, context) => {
    let headers = {
        'Content-Type': 'application/json'
    }
    headers['x-role-key'] = context.user.role.key
    return headers
}

const buildPayload = (data, hook, context) => {
    if (hook.data) {
        return hook.data
    }
}

const buildUrl = (data, hook, context) => {
    return templateHelper.formatter(hook.url || '').inject(data)
}

exports.process = async (entity, context) => {
    let template = await templates.get(entity.type, context)
    let hook = await getHook(entity.status.code, template)
    let action = hook.before || hook.after
    const args = {
        headers: buildHeader(entity, action, context),
        data: buildPayload(entity, action, context)
    }
    let url = buildUrl(entity.toObject(), action, context)

    let response = null
    action.action = action.action || 'POST'

    try {
        switch (action.action.toUpperCase()) {
            case 'POST':
                response = await client.postPromise(url, args)
                break
            case 'PUT':
                response = await client.putPromise(url, args)
                break
        }

        context.logger.info('response', response.data)
        return response.data
    } catch (err) {
        context.logger.error(err)
        return null
    }
}
