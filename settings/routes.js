'use strict'
const contextBuilder = require('../helpers/context-builder')
const apiRoutes = require('@open-age/express-api')
const fs = require('fs')
const specs = require('../specs')

module.exports.configure = (app, logger) => {
    logger.start('settings:routes:configure')

    let specsHandler = function (req, res) {
        fs.readFile('./public/specs.html', function (err, data) {
            if (err) {
                res.writeHead(404)
                res.end()
                return
            }
            res.contentType('text/html')
            res.send(data)
        })
    }

    app.get('/', specsHandler)

    app.get('/specs', specsHandler)

    app.get('/api/specs', function (req, res) {
        res.contentType('application/json')
        res.send(specs.get())
    })

    var api = apiRoutes(app, { context: { builder: contextBuilder.create } })
    api.model('users').register('REST', { permissions: 'tenant.user' })
    api.model('projects').register('REST', { permissions: 'tenant.user' })
    api.model('sprints').register('REST', { permissions: 'tenant.user' })
    api.model('releases').register('REST', { permissions: 'tenant.user' })
    api.model('workflows').register('REST', { permissions: 'tenant.user' })
    api.model('task-templates').register('REST', { permissions: 'tenant.user' })
    api.model('project-types').register('REST', { permissions: 'tenant.user' })
    api.model('tasks').register('REST', { permissions: 'tenant.user' })
        .register([{
            action: 'GET',
            method: 'sync',
            url: '/sync',
            permissions: 'tenant.user'
        }])
    logger.end()
}
