'use strict'

const db = require('../models')
const templateHelper = require('../helpers/template')

const workflows = require('./workflows')

const populate = 'workflow children'

const merge = (model, data) => {
    if (!data) {
        return model
    }

    for (const field of Object.getOwnPropertyNames(data)) {
        if (!model[field]) {
            model[field] = data[field]
        } else {
            model[field] = merge(model[field], data[field])
        }
    }

    return model
}

const set = async (model, entity, context) => {
    if (model.code !== undefined && model.code != entity.code) {
        let exists = await exports.get(model.code, context)

        if (exists) {
            throw new Error('code ' + model.code + ' already exists')
        }
        entity.code = model.code.toLowerCase()
    }

    if (model.name !== undefined) {
        entity.name = model.name
    }

    if (model.subject !== undefined) {
        entity.subject = model.subject
    }

    if (model.description !== undefined) {
        entity.description = model.description
    }

    if (model.assignee !== undefined && entity.assignee !== model.assignee) {
        entity.assignee = model.assignee
    }

    if (model.size !== undefined && entity.size !== model.size) {
        entity.size = model.size
    }

    if (model.priority !== undefined) {
        entity.priority = model.priority
    }

    if (model.type) {
        entity.type = model.type
    }

    if (model.workflow) {
        let workflow = await workflows.get(model.workflow, context)

        if (!workflow) {
            workflow = await workflows.create({
                code: model.workflow.code
            }, context)
        }

        entity.workflow = workflow
    }

    if (model.meta) {
        entity.meta = model.meta
    }

    if (model.children) {
        entity.children = []
        for (const item of model.children) {
            let child = await this.get(item, context)

            if (!child) {
                child = await this.create(item, context)
            }

            entity.children.push(child)
        }
    }

    if (model.hooks && model.hooks.length) {
        entity.hooks = model.hooks
    }

    return entity
}

exports.create = async (model, context) => {
    if (!model.code) {
        throw new Error('code is required')
    }

    let entity = await exports.get(model, context)

    // allowing templates to be created
    // if (entity) {
    //     throw new Error('code ' + model.code + ' already exists')
    // }

    if (!entity) {
        entity = new db.taskTemplate({
            code: model.code.toLowerCase(),
            // organization: context.organization,
            tenant: context.tenant
        })
    }

    await set(model, entity, context)

    await entity.save()

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await exports.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        // organization: context.organization,
        tenant: context.tenant
    }

    if (query.workflow) {
        where.workflow = await workflows.get(query.workflow, context)
    }

    if (query.type) {
        where.type = query.type
    }

    const count = await db.taskTemplate.find(where).count()
    let items
    if (page) {
        items = await db.taskTemplate.find(where).skip(page.skip).limit(page.limit).populate(populate)
    } else {
        items = await db.taskTemplate.find(where).populate(populate)
    }

    return {
        count: count,
        items: items
    }
}

const taskBuilder = async (model, template, meta, context) => {
    let data = {
        context: context,
        meta: meta
    }

    model.subject = templateHelper.formatter(template.subject || '').inject(data)
    model.description = templateHelper.formatter(template.description || '').inject(data)
    model.assignee = templateHelper.formatter(template.assignee || '').inject(data)
    model.size = template.size
    model.priority = template.priority
    model.meta = meta
    model.type = template.type
    model.workflow = template.workflow
    model.hooks = template.hooks

    if (template.children && template.children.length) {
        model.children = []
        for (const childTemplate of template.children) {
            let childTask = await taskBuilder({}, childTemplate, meta, context)
            model.children.push(childTask)
        }
    }
    return model
}

exports.build = async (model, meta, context) => {
    context.logger.silly('services/task-templates:get')

    let template = await this.get(model.template, context)

    if (!template) {
        throw new Error(`template does not exist`)
    }

    meta = merge(meta, template.meta)

    meta = JSON.parse(templateHelper.formatter(JSON.stringify(meta)).inject({
        context: context,
        meta: meta
    }))

    return taskBuilder(model, template, meta, context)
}

exports.get = async (query, context) => {
    context.logger.silly('services/task-templates:get')

    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.taskTemplate.findById(query).populate(populate)
        } else {
            return db.taskTemplate.findOne({
                code: query.toLowerCase(),
                tenant: context.tenant
            }).populate(populate)
        }
    } else if (query.id) {
        return db.taskTemplate.findById(query.id).populate(populate)
    } else if (query.code) {
        return db.taskTemplate.findOne({
            code: query.code.toLowerCase(),
            tenant: context.tenant
        }).populate(populate)
    }
}
