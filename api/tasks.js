const api = require('./api-base')('tasks', 'task')

const service = require('../services/tasks')
const mapper = require('../mappers/task')

const queryHelper = require('../helpers/request-query')

api.get = async (req) => {
    let query = queryHelper.inflate(req.query)

    let param = {
        project: query.project
    }

    if (req.params.id.isObjectId()) {
        param.id = req.params.id
    } else {
        param.code = req.params.id
    }

    let entity = await service.get(param, req.context)

    if (!entity) {
        throw new Error(`RESOURCE_NOT_FOUND`)
    }
    return mapper.toModel(entity, req.context)
}
module.exports = api
