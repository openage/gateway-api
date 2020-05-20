'use strict'

const db = require('../models')
const workflows = require('./workflows')
const populate = 'workflows'

const set = async (model, entity, context) => {
    if (model.code !== undefined) {
        entity.code = model.code.toLowerCase()
    }

    if (model.name !== undefined) {
        entity.name = model.name
    }

    if (model.description !== undefined) {
        entity.description = model.description
    }

    if (model.roles) {
        entity.roles = model.roles.map(r => {
            if (typeof r === 'string') {
                r = {
                    code: r
                }
            }
            return {
                code: r.code.toLowerCase(),
                name: r.name
            }
        })
    }

    if (model.workflows) {
        entity.workflows = []
        for (const item of model.workflows) {
            entity.workflows.push(await workflows.get(item, context))
        }
    }
    return entity
}

exports.create = async (model, context) => {
    const log = context.logger.start('services/project-types:create')

    model.code = model.code.toLowerCase()

    let entity = await exports.get(model, context)

    if (entity) {
        throw new Error(`project type with code '${model.code}' already exists`)
    }

    entity = new db.projectType({
        code: model.code.toLowerCase(),
        tenant: context.tenant
    })

    await set(model, entity, context)

    await entity.save()
    log.end()

    return entity
}

exports.update = async (id, model, context) => {
    const log = context.logger.start('services/project-types:update')

    let entity = await this.get(id, context)

    await set(model, entity, context)

    log.end()
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }

    const count = await db.projectType.find(where).count()
    let items
    if (page) {
        items = await db.projectType.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.projectType.find(where).populate(populate)
    }

    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    context.logger.silly('services/project-types:get')
    let where = {
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.projectType.findById(query).populate(populate)
        }
        where['code'] = query.toLowerCase()
        return db.projectType.findOne(where).populate(populate)
    } else if (query.id) {
        return db.projectType.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        return db.projectType.findOne(where).populate(populate)
    }

    return null
}
