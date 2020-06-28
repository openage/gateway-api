const client = new (require('node-rest-client-promise')).Client()
var appRoot = require('app-root-path')
var systemHooks = require('config').get('hooks')

/**
 * action: {
 *     "code": "update-ams-user",
 *     "name": "Yesterday's Task",
 *     "handler": "app", // app,backend,
 *     "type": "view-task-list", // GET, POST, PUT, DELETE
 *     "config": {
 *         url: ':ams/users'
 *         url: 'http://...',
 *         action: 'POST'
 *         headers: {
 *             x-role-key: '{{context.role.key}}'
 *         },
 *         data: {} // if specified is the payload
 *     }
 * }
 */

const getMapper = (mapper, context) => {
    if (mapper) {
        if (mapper.code) {
            let handler = require(`${appRoot}/mappers/${mapper.code}`)

            return {
                toModel: mapper.method ? handler[mapper.method] : handler.toModel
            }
        }
    }

    return {
        toModel: (e) => {
            return e
        }
    }
}

const buildUrl = (config, injectorData, context) => {
    let url = config.url

    if (url.startsWith(':')) {
        let serviceCode = url.split('/')[0].substr(1)

        let service = context.services[serviceCode]
        url = url.replace(`:${serviceCode}`, service.url)
    }

    return url.inject(injectorData)
}

const buildHeader = (config, injectorData, context) => {
    let headers = JSON.parse(JSON.stringify(config.headers).inject(injectorData))

    if (context.tenant) {
        headers['x-tenant-code'] = context.tenant.code
    }

    return headers
}

const buildPayload = (config, data, injectorData, context) => {
    let payload = data

    if (config.data) {
        payload = JSON.parse(JSON.stringify(config.data).inject(injectorData))

        const removeEmpty = (obj) => {
            for (const key of Object.keys(obj)) {
                const value = obj[key]
                if (typeof value === 'object') {
                    obj[key] = removeEmpty(value)
                }

                if (value === 'undefined') {
                    obj[key] = undefined
                } else if (value === 'null') {
                    obj[key] = null
                }
            }
            return obj
        }

        payload = removeEmpty(payload)
    }

    if (!config.mapper) {
        return payload
    }

    return getMapper(config.mapper).toModel(data, context)
}

const parseResponse = (response, config, context) => {
    // if (response.response.statusCode !== 200) {
    //     throw new Error(response.response.statusMessage)
    // }

    if (!config.response) {
        if (response) {
            if (response.data && response.data.message) {
                return response.data.message
            }

            if (response.message) {
                return response.message
            }
        }

        return 'success'
    }

    if (config.response.data) {
        return config.response.data
    }

    return getMapper(config.response.mapper).toModel(response, context)
}

const getActions = (trigger, entity, context) => {
    let actions = []

    let add = items => {
        let hook = items.find(h =>
            h.trigger.entity.toLowerCase() === trigger.entity.toLowerCase() &&
            h.trigger.action.toLowerCase() === trigger.action.toLowerCase())

        if (hook && hook.actions && hook.actions.length) {
            hook.actions.forEach(a => {
                a.type = a.type || 'http'
                if (a.type.toLowerCase() === 'http' &&
                    a.handler === 'backend' &&
                    !actions.find(o => o.code.toLowerCase() === a.code.toLowerCase())
                ) {
                    actions.push(a)
                }
            })
        }
    }

    if (entity.status.hooks) {
        add(entity.status.hooks || [])
    }

    if (context.organization) {
        add(context.organization.hooks || [])
    }

    if (context.tenant) {
        add(context.tenant.hooks || [])
    }

    if (systemHooks && systemHooks.length) {
        add(systemHooks || [])
    }

    return actions
}

/**
 * "trigger": {
 *   "entity": "attendance",
 *   "action": "check-in",
 *   "when": "before"
 * }
*/

exports.send = async (trigger, entity, context) => {
    let actions = getActions(trigger, entity, context)

    context.logger.debug(`actions: ${actions.length}`)

    for (const action of actions) {
        let log = context.logger.start(`actions/${action.code}`)
        let config = action.config

        const injectorData = {
            data: entity,
            context: context
        }

        let url = buildUrl(config, injectorData, context)

        const args = {
            headers: buildHeader(config, injectorData, context),
            data: buildPayload(config, entity, injectorData, context)
        }

        log.debug(JSON.stringify({
            url: `[${config.url}] ${url}`,
            action: config.action,
            data: args.data
        }))

        let response

        switch (config.action.toUpperCase()) {
            case 'POST':
                response = await new Promise((resolve, reject) => {
                    return require('request')({ url: url, method: 'POST', json: args.data, headers: args.headers }, (err, response, body) => {
                        if (err) {
                            return reject(err)
                        }
                        return resolve(body)
                    })
                })
                break
            case 'PUT':
                response = await new Promise((resolve, reject) => {
                    return require('request')({ url: url, method: 'PUT', json: args.data, headers: args.headers }, (err, response, body) => {
                        if (err) {
                            return reject(err)
                        }
                        return resolve(body)
                    })
                })
                break
            case 'GET':
                response = await client.getPromise(url, args)
                break
            case 'DELETE':
                response = await client.deletePromise(url, args)
                break
        }

        let parsedResponse = parseResponse(response, config, context)

        log.info('response', parsedResponse)
        log.end()
    }
}
