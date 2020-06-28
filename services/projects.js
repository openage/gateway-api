'use strict'

const db = require('../models')
const types = require('./project-types')
const members = require('./members')

const populate = [{
    path: 'parent'
}, {
    path: 'children'
}, {
    path: 'members.user'
}, {
    path: 'workflows'
}, {
    path: 'type',
    populate: {
        path: 'workflows'
    }
}]

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

    if (model.type && (!entity.type || model.type.code.toLowerCase() !== entity.type.code.toLowerCase())) {
        entity.type = await types.get(model.type, context)
    }

    if (model.externalId !== undefined) {
        entity.externalId = model.externalId
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

    if (model.isClosed !== undefined) {
        entity.isClosed = model.isClosed
    }

    if (model.velocity !== undefined) {
        entity.velocity = model.velocity
    }

    if (model.members) {
        await members.update(entity, model.members, context)
    }

    entity.config = entity.config || {
        task: {
            lastNo: 0,
            provider: null
        },
        sprint: {
            lastNo: 0,
            schedule: {
                period: 2,
                type: 'week'
            }
        },
        release: {
            lastNo: {
                major: 0,
                minor: 0,
                patch: 0

            }
        }
    }

    if (model.parent) {
        let parent = await exports.get(model.parent, context)

        if (!entity.parent || entity.parent.id !== parent.id) {
            parent.children = parent.children || []
            parent.children.push(entity)
            await parent.save()

            entity.parent = parent
        }
    } else if (model.parent === null && entity.parent) {
        let parent = await exports.get(entity.parent, context)
        entity.parent = undefined
        parent.children = parent.children.filter(c => c.id === entity.id)
        await parent.save()
    }

    return entity
}

exports.create = async (model, context) => {
    const log = context.logger.start('services/projects:create')

    model.code = model.code.toLowerCase()

    let entity = await exports.get(model, context)

    if (entity) {
        throw new Error(`project with code '${model.code}' already exists`)
    }

    entity = new db.project({
        code: model.code.toLowerCase(),
        members: [{
            user: context.user,
            size: 0,
            burnt: 0,
            roles: ['owner']
        }],
        type: null,
        organization: context.organization,
        tenant: context.tenant
    })

    if (model.entity) {
        entity.entity = {
            id: model.entity.id.toString().toLowerCase(),
            type: model.entity.type.toLowerCase(),
            name: model.entity.name
        }
    }

    await set(model, entity, context)

    await entity.save()
    log.end()

    return entity
}

exports.update = async (id, model, context) => {
    const log = context.logger.start('services/projects:update')

    let entity = await this.get(id, context)

    await set(model, entity, context)

    log.end()
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (query.entity) {
        where = {
            'entity.id': query.entity.id,
            'entity.type': query.entity.type.toLowerCase()
        }
    } else if (query.type) {
        where['type'] = await types.get(query.type, context)
    } else {
        where['type'] = {
            $exists: true
        }
    }

    where.parent = null

    if (query.my) {
        where['members.user'] = context.user
    }

    const count = await db.project.find(where).count()
    let items
    if (page) {
        items = await db.project.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.project.find(where).populate(populate)
    }

    return {
        count: count,
        items: items
    }
}

exports.get = async (query, context) => {
    context.logger.silly('services/projects:get')
    if (!query) {
        return
    }
    let where = {
        organization: context.organization,
        tenant: context.tenant
    }
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.project.findById(query).populate(populate)
        }
        where['code'] = query.toLowerCase()
        return db.project.findOne(where).populate(populate)
    } else if (query.id) {
        return db.project.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        return db.project.findOne(where).populate(populate)
    } else if (query.entity) {
        where['entity.id'] = query.entity.id
        where['entity.type'] = query.entity.type.toLowerCase()
        return db.project.findOne(where).populate(populate)
    }
}

exports.newSprintNo = async (project, context) => {
    project = await exports.get(project, context)
    let lock = await context.lock(`project:${project.id}`)
    project.config = project.config || {}
    project.config.sprint = project.config.sprint || {}
    project.config.sprint.lastNo = (project.config.sprint.lastNo || 0) + 1
    await project.save()
    lock.release()

    return `${project.code}-${project.config.sprint.lastNo}`
}

exports.newTaskNo = async (project, context) => {
    project = await exports.get(project, context)
    let lock = await context.lock(`project:${project.id}`)
    project.config = project.config || {}
    project.config.task = project.config.task || {}
    project.config.task.lastNo = (project.config.task.lastNo || 0) + 1
    await project.save()
    lock.release()

    return `${project.code}-${project.config.task.lastNo}`
}

exports.newPatchReleaseNo = async (project, context) => {
    project = await exports.get(project, context)
    let lock = await context.lock(`project:${project.id}`)
    project.config = project.config || {}
    project.config.release = project.config.release || {}
    project.config.release.lastNo = project.config.release.lastNo || {}

    let lastNo = project.config.release.lastNo

    lastNo.patch = (lastNo.patch || 0) + 1

    await project.save()

    lock.release()

    return `${project.code}-${lastNo.major}.${lastNo.minor}.${lastNo.patch}`
}

exports.newMinorReleaseNo = async (project, context) => {
    project = await exports.get(project, context)
    let lock = await context.lock(`project:${project.id}`)
    project.config = project.config || {}
    project.config.release = project.config.release || {}
    project.config.release.lastNo = project.config.release.lastNo || {}

    let lastNo = project.config.release.lastNo

    lastNo.minor = (lastNo.minor || 0) + 1
    lastNo.patch = 0

    await project.save()

    lock.release()

    return `${project.code}-${lastNo.major}.${lastNo.minor}.${lastNo.patch}`
}

exports.newMajorReleaseNo = async (project, context) => {
    project = await exports.get(project, context)
    let lock = await context.lock(`project:${project.id}`)
    project.config = project.config || {}
    project.config.release = project.config.release || {}
    project.config.release.lastNo = project.config.release.lastNo || {}

    let lastNo = project.config.release.lastNo

    lastNo.major = (lastNo.major || 0) + 1
    lastNo.minor = 0
    lastNo.patch = 0

    await project.save()

    lock.release()

    return `${project.code}-${lastNo.major}.${lastNo.minor}.${lastNo.patch}`
}
