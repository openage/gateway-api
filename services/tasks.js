'use strict'

const db = require('../models')
const offline = require('@open-age/offline-processor')
const projects = require('./projects')
const releases = require('./releases')
const sprints = require('./sprints')
const users = require('./users')
const workflows = require('./workflows')
const templates = require('./task-templates')

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
    path: 'children'
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
        entity.meta = model.meta
    }

    let workflowCode = entity.type

    if (model.workflow && !entity.workflow) {
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
        entity.status = entity.workflow.states.find(i => i.code.toLowerCase() === statusCode.toLowerCase())

        if (!entity.status) {
            entity.status = entity.workflow.states.find(i => i.isFirst)
        }

        if (entity.isClosed !== model.status.isFinal) {
            entity.isClosed = model.status.isFinal
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

    if (!model.project) {
        if (model.entity) {
            model.project = {
                code: `${model.entity.type}-${model.entity.id}`,
                name: model.entity.name,
                entity: model.entity
            }
        }
    }

    let project = await projects.get(model.project, context)

    if (!project) {
        project = await projects.create(model.project, context)
    }

    let code = ''
    if (model.code) {
        code = model.code.toLowerCase()
    } else {
        code = await projects.newTaskNo(project.id, context)
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
        organization: context.organization,
        tenant: context.tenant
    })

    if (model.entity) {
        entity.entity = {
            id: model.entity.id.toLowerCase(),
            type: model.entity.type.toLowerCase(),
            name: model.entity.name
        }
    }

    await set(model, entity, context)

    await entity.save()

    await offline.queue('task', 'create', entity, context)

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    if (!entity) {
        entity = await db.task.findOne({ externalId: id }).populate(populate)
    }
    const prevStatus = entity.status.code
    await set(model, entity, context)
    if (entity.status.code != prevStatus) {
        await offline.queue('task', 'updated', entity, context)
    }
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        organization: context.organization,
        tenant: context.tenant
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
            where['status.code'] = query.status.code.toLowerCase()
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
        if (query.release !== null) {
            where.release = await releases.get(query.release, context)
        } else {
            where.release = null
        }
    }

    if (query.sprint !== undefined) {
        if (query.sprint !== null && !(query.sprint.id === 'none' || query.sprint.id === 'backlog' || query.sprint.code === 'backlog')) {
            where.sprint = await sprints.get(query.sprint, context)
        } else {
            where.sprint = null
        }
    }

    if (query.parent !== undefined) {
        if (query.parent !== null && query.parent.id !== 'none') {
            where.parent = await exports.get(query.parent, context)
        } else {
            where.parent = null
        }
    }

    if (query.dependsOn !== undefined) {
        if (query.dependsOn !== null) {
            where.dependsOn = await exports.get(query.dependsOn, context)
        } else {
            where.dependsOn = null
        }
    }

    if (query.assignee !== undefined) {
        if (query.assignee === null) {
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

    if (query.isClosed !== undefined) {
        where.isClosed = query.isClosed
    }

    const count = await db.task.find(where).count()
    let items
    if (page) {
        items = await db.task.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.task.find(where).populate(populate)
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
