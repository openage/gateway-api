const db = require('../models')

const projects = require('./projects')
const members = require('./members')

const populate = 'members.user'

const set = async (model, entity, context) => {
    if (model.code !== undefined) {
        entity.code = model.code.toLowerCase()
    }

    if (model.name !== undefined) {
        entity.name = model.name
    }

    if (model.externalId !== undefined) {
        entity.externalId = model.externalId
    }

    if (model.isClosed !== undefined) {
        entity.isClosed = model.isClosed
    }

    if (model.size !== undefined) {
        entity.size = model.size
    }

    if (model.burnt !== undefined) {
        entity.burnt = model.burnt
    }

    if (model.plan) {
        entity.plan = entity.plan || {}
        if (model.plan.start !== undefined) {
            entity.plan.start = model.plan.start
        }
        if (model.plan.finish !== undefined) {
            entity.plan.finish = model.plan.finish
        }
    }

    if (model.actual) {
        entity.actual = entity.actual || {}
        if (model.actual.start !== undefined) {
            entity.actual.start = model.actual.start
        }
        if (model.actual.finish !== undefined) {
            entity.actual.finish = model.actual.finish
        }
    }

    if (model.members) {
        await members.update(entity, model.members, context)
    }

    return entity
}

exports.create = async (model, context) => {
    let project = await projects.get(model.project, context)
    if (model.code) {
        model.code = model.code.toLowerCase()
    } else {
        model.code = await projects.newSprintNo(project, context)
    }

    let entity = await this.get({
        code: model.code,
        project: project
    }, context)

    if (entity) {
        throw new Error(`sprint code '${model.code}' already exists`)
    }

    entity = new db.sprint({
        code: model.code,
        isClosed: false,
        project: project,
        organization: context.organization,
        tenant: context.tenant
    })

    await set(model, entity, context)

    await entity.save()

    return entity
}

exports.update = async (id, model, context) => {
    const log = context.logger.start('services/sprints:update')

    let entity = await this.get(id, context)

    await set(model, entity, context)

    log.end()
    return entity.save()
}

exports.get = async (query, context) => {
    context.logger.silly('services/sprints:get')
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.sprint.findById(query).populate(populate)
        }

        where['code'] = query.toLowerCase()
        return db.sprint.findOne(where).populate(populate)
    } else if (query.id) {
        return db.sprint.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        return db.sprint.findOne(where).populate(populate)
    }
}

exports.search = async (query, page, context) => {
    const log = context.logger.start('services/sprints:search')
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (query.project) {
        where.project = await projects.get(query.project, context)
    }

    if (query.isClosed !== undefined) {
        where.isClosed = query.isClosed
    }

    const count = await db.sprint.find(where).count()
    let items
    if (page) {
        items = await db.sprint.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.sprint.find(where).populate(populate)
    }

    log.end()
    return {
        count: count,
        items: items
    }
}
