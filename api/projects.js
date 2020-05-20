const api = require('./api-base')('projects', 'project')

const service = require('../services/projects')
const sprintService = require('../services/sprints')
const mapper = require('../mappers/project')

api.get = async (req) => {
    let entity = await service.get(req.params.id, req.context)

    if (!entity) {
        throw new Error(`RESOURCE_NOT_FOUND`)
    }

    let sprintSearch = await sprintService.search({
        project: {
            id: entity.id
        },
        isClosed: false
    }, null, req.context)

    entity.sprints = sprintSearch.items
    return mapper.toModel(entity, req.context)
}

module.exports = api
