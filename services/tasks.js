'use strict'

const db = require('../models')
const offline = require('@open-age/offline-processor')
const projects = require('./projects')
const releases = require('./releases')
const sprints = require('./sprints')
const users = require('./users')
const workflows = require('./workflows')
const templates = require('./task-templates')
const members = require('./members')

const populate = [{
    path: 'owner'
}, {
    path: 'assignee'
}, {
    path: 'project'
}, {
    path: 'release'
}, {
    path: 'sprint'
}, {
    path: 'workflow',
    populate: {
        path: 'children'
    }
}, {
    path: 'parent'
}, {
    path: 'dependsOn'
}, {
    path: 'children',
    populate: [{
        path: 'workflow'
    }, {
        path: 'assignee'
    }, {
        path: 'members.user'
    }, {
        path: 'project'
    }]
}, {
    path: 'members.user'
}]

const set = async (model, entity, context) => {
    let recalculate = false
    if (model.subject !== undefined) {
        entity.subject = model.subject
    }

    if (model.description !== undefined) {
        entity.description = model.description
    }

    if (model.type !== undefined && entity.type !== model.type) {
        entity.type = model.type
    }

    if (model.externalId !== undefined) {
        entity.externalId = model.externalId
    }

    if (model.size !== undefined && entity.size !== model.size) {
        entity.size = model.size
        // TODO: update sprint, parent
    }

    if (model.burnt !== undefined && entity.burnt !== model.burnt) {
        entity.burnt = model.burnt
        // TODO: update sprint, parent
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

    if (model.priority !== undefined) {
        entity.priority = model.priority
    }

    if (model.order !== undefined) {
        entity.order = model.order
    }

    if (model.percentage !== undefined) {
        entity.percentage = model.percentage
    }

    if (model.members) {
        await members.update(entity, model.members, context)
    }

    if (model.dependsOn) {
        let dependsOn = await exports.get(model.dependsOn, context)

        if (dependsOn.id !== entity.dependsOn.id) {
            entity.dependsOn = dependsOn

            // TODO: cascade dates
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

    if (model.children && model.children.length && (!entity.children || entity.children.length != model.children.length)) {
        entity.children = []
        for (const child of model.children) {
            if (entity.entity) {
                child.entity = entity.entity
            }
            if (entity.project) {
                child.project = await projects.get(entity.project, context)
            }
            entity.children.push(await this.create(child, context))
        }
    }

    if (model.project) {
        entity.project = await projects.get(model.project, context)
    }

    if (model.release) {
        entity.release = await releases.get(model.release, context)
    }

    if (model.sprint) {
        let newSprint = await sprints.get(model.sprint, context)

        if (entity.sprint && newSprint.id !== entity.sprint.id) {
            let oldSprint = entity.sprint
            // TODO: update old sprint

            entity.sprint = newSprint
            // TODO: update new sprint
        }
    }

    if (model.assignee) {
        entity.assignee = await users.get(model.assignee, context)
    }

    if (model.meta) {
        entity.meta = entity.meta || {}
        Object.getOwnPropertyNames(model.meta).forEach(key => {
            entity.meta[key] = model.meta[key]
        })
        entity.markModified('meta')
    }

    let workflowCode = entity.type

    if (model.workflow && model.workflow.code && !entity.workflow) {
        workflowCode = model.workflow.code
    }

    if (!entity.workflow || entity.workflow.code !== workflowCode) {
        let workflow = await workflows.get(workflowCode, context)

        if (!workflow) {
            workflow = await workflows.create({
                code: workflowCode
            }, context)
        }

        entity.workflow = workflow

        if (!model.status) {
            // ensure we have right status set

            if (entity.status.code) {
                model.status = entity.status
            } else {
                model.status = entity.workflow.states.find(i => i.isFirst)
            }
        }
    }

    if (model.status) {
        let statusCode = typeof model.status === 'string' ? model.status : model.status.code
        let oldStatus = entity.status ? entity.status.code : null
        entity.status = entity.workflow.states.find(i => i.code.toLowerCase() === statusCode.toLowerCase())

        if (!entity.status) {
            entity.status = entity.workflow.states.find(i => i.isFirst)
        }

        entity.status.date = new Date()

        context.journal.add('status', entity.status.code, oldStatus)

        if (entity.isClosed !== (model.status.isFinal || entity.status.isFinal)) {
            entity.isClosed = model.status.isFinal || entity.status.isFinal
            recalculate = true
        }
    }

    if (recalculate) {
        // TODO:
    }

    return entity
}

exports.create = async (model, context) => {
    if (model.template) {
        model = await templates.build(model, model.meta, context)
    }

    model.parent = await this.get(model.parent, context)

    if (!model.project) {
        if (model.parent && model.parent.project) {
            model.project = model.parent.project
        } else if (model.entity) {
            model.project = {
                code: `${model.entity.type}-${model.entity.id}`,
                name: model.entity.name,
                entity: model.entity
            }
        }
    }

    let project = await projects.get(model.project, context)

    if (!project && model.project) {
        project = await projects.create(model.project, context)
    }

    let code = ''
    if (model.code) {
        code = model.code.toLowerCase()
    } else {
        if (project) {
            code = await projects.newTaskNo(project.id, context)
        }
    }

    let entity = await exports.get(model, context)

    if (entity) {
        throw new Error('task code ' + model.code + ' already exists')
    }

    let type = 'task'
    if (model.type) {
        type = model.type
    } else if (model.workflow && model.workflow.code) {
        type = model.workflow.code
    }

    entity = new db.task({
        code: code,
        type: type,
        owner: context.user,
        createdOn: new Date(),
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

    context.journal.create({
        id: entity.id,
        code: entity.code,
        type: 'task',
        name: entity.type
    })

    await set(model, entity, context)

    await entity.save()

    await offline.queue('task', 'create', entity, context)

    await context.journal.end()

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    if (!entity) {
        entity = await db.task.findOne({
            externalId: id
        }).populate(populate)
    }

    context.journal.update({
        id: entity.id,
        code: entity.code,
        type: 'task',
        name: entity.type
    })

    const prevStatus = entity.status.code
    await set(model, entity, context)
    if (entity.status.code !== prevStatus) {
        if (entity.processing && entity.processing == 'immidate') {
            context.processSync = true
        }
        await offline.queue('task', 'updated', entity, context)
    }
    await context.journal.end()
    return entity.save()
}

exports.search = async (query, page, context) => {
    let sorting = 'recent'
    if (page && page.sort) {
        sorting = page.sort
    }

    let sort = {
        timeStamp: 1
    }

    switch (sorting.toLowerCase()) {
        case 'recent':
            sort.timeStamp = -1
            break
        case 'timestamp':
            sort.timeStamp = -1
            break
        case 'subject':
            sort.subject = 1
            break
    }

    let where = {
        tenant: context.tenant
    }

    if (context.organization) {
        where.organization = context.organization
    }

    if (query.entity) {
        where['entity.id'] = query.entity.id.toLowerCase()
        if (query.entity.type) {
            where['entity.type'] = query.entity.type.toLowerCase()
        }
    }

    if (query.status) {
        if (typeof query.status === 'string') {
            where['status.code'] = query.status.toLowerCase()
        } else if (query.status.code) {
            if (query.status.code.includes(',')) {
                where['status.code'] = {
                    $in: query.status.code.split(',').map(i => i)
                }
            } else {
                where['status.code'] = query.status.code.toLowerCase()
            }
        }

        if (query.status.isFirst !== undefined) {
            where['status.isFirst'] = query.status.isFirst === 'true' || query.status.isFirst === true
        }
        if (query.status.isPaused !== undefined) {
            where['status.isPaused'] = query.status.isPaused === 'true' || query.status.isPaused === true
        }

        if (query.status.isCancelled !== undefined) {
            where['status.isCancelled'] = query.status.isCancelled === 'true' || query.status.isCancelled === true
        }

        if (query.status.isFinal !== undefined) {
            where['status.isFinal'] = query.status.isFinal === 'true' || query.status.isFinal === true
        }
    }

    if (query.project) {
        where.project = await projects.get(query.project, context)
    }

    if (query.release !== undefined) {
        if (query.release === null || (query.release.id || query.release.code || query.release) === 'none') {
            where.release = null
        } else {
            where.release = await releases.get(query.release, context)
        }
    }

    if (query.sprint !== undefined) {
        if (query.sprint === null || (query.sprint.id || query.sprint.code || query.sprint) === 'none' || (query.sprint.id || query.sprint.code || query.sprint) === 'backlog') {
            where.sprint = null
        } else {
            where.sprint = await sprints.get(query.sprint, context)
        }
    }

    if (query.parent !== undefined) {
        if (query.parent === null || (query.parent.id || query.parent.code || query.parent) === 'none') {
            where.parent = null
        } else {
            where.parent = await exports.get(query.parent, context)
        }
    }

    if (query.dependsOn !== undefined) {
        if (query.dependsOn === null || (query.dependsOn.id || query.dependsOn.code || query.dependsOn) === 'none') {
            where.dependsOn = null
        } else {
            where.dependsOn = await exports.get(query.dependsOn, context)
        }
    }

    if (query.assignee !== undefined) {
        if (query.assignee === null || (query.assignee.id || query.assignee.code || query.assignee) === 'none') {
            where.assignee = null // unassigned
        } else if (query.assignee === 'my') {
            where.assignee = context.user // my tasks
        } else {
            // get assignee based on assignee-role-id, assignee-code, assignee-email etc
            where.assignee = await users.get(query.assignee, context)

            if (!where.assignee) {
                return {
                    count: 0,
                    items: []
                }
            }
        }
    }

    if (query.owner !== undefined) {
        if (query.owner === null) {
            where.owner = null
        } else if (query.owner === 'my') {
            where.owner = context.user
        } else {
            where.owner = await users.get(query.owner, context)

            if (!where.owner) {
                return {
                    count: 0,
                    items: []
                }
            }
        }
    }

    if (query.workflow) {
        where.workflow = await workflows.get(query.workflow, context)
    }

    if (query.type) {
        where.type = query.type
    }

    if (query.meta) {
        for (var prop in query.meta) {
            if (prop.includes('name') || prop.includes('Name')) {
                where[`meta.${prop}`] = {
                    $regex: '^' + query.meta[prop],
                    $options: 'i'
                }
            } else if (prop.includes('colleges') || prop.includes('courses') || prop.includes('batches')) {
                where[`meta.${prop}`] = {
                    $in: query.meta[prop].split(',').map(i => i)
                }
            } else {
                where[`meta.${prop}`] = query.meta[prop]
            }
        }
    }

    if (query.isClosed !== undefined) {
        where.isClosed = query.isClosed
    }

    const count = await db.task.find(where).count()
    let items
    if (page) {
        items = await db.task.find(where).sort(sort).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.task.find(where).sort(sort).populate(populate)
    }

    return {
        count: count,
        items: items
    }
}

exports.sync = async (project, context) => {
    const taskProvider = require(`../providers/${project.config.task.provider.type}`)
    let issues = await taskProvider.getIssues(project.config.task.provider.config, context)

    let count = 0

    for (let issue of issues) {
        let task = await exports.get({
            externalId: issue.externalId,
            project: project
        }, context)

        if (!task) {
            issue.project = project
            task = exports.create(issue, context)
            count++
        }

        await set(issue, task, context)
        await task.save()
    }

    return `total ${count} new task added`
}

exports.get = async (query, context) => {
    if (!query) {
        return
    }
    context.logger.silly('services/tasks:get')

    if (query._bsontype === 'ObjectID') {
        query = {
            id: query.toString()
        }
    }

    let where = {
        organization: context.organization,
        tenant: context.tenant
    }

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.task.findById(query).populate(populate)
        }

        where['code'] = query.toLowerCase()
        return db.task.findOne(where).populate(populate)
    } else if (query.id) {
        return db.task.findById(query.id).populate(populate)
    } else if (query.code) {
        where['code'] = query.code.toLowerCase()
        return db.task.findOne(where).populate(populate)
    } else if (query.externalId) {
        where['externalId'] = query.externalId
        return db.task.findOne(where).populate(populate)
    }
}

exports.remove = async (id, context) => {
    let entity = await this.get(id, context, false)

    for (const child of entity.children) {
        await this.remove(child.id, context)
    }

    await entity.remove()
}
