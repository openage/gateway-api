'use strict'
const db = require('../models')

const populate = 'children'
const set = async (model, entity, context) => {
    if (model.code) {
        entity.code = model.code.toLowerCase()
    }

    if (model.name) {
        entity.name = model.name
    }

    if (model.description) {
        entity.description = model.description
    }

    if (model.estimate) {
        entity.estimate = model.estimate
    }

    if (model.meta) {
        entity.meta = model.meta
    }

    if (model.states) {
        entity.states = []
        for (const stateModel of model.states) {
            let code = stateModel.code.toLowerCase()
            let state = {
                code: code,
                action: stateModel.action || code,
                name: stateModel.name || code,
                estimate: stateModel.estimate || 0,
                isFirst: !!stateModel.isFirst,
                isPaused: !!stateModel.isPaused,
                isCancelled: !!stateModel.isCancelled,
                isFinal: !!stateModel.isFinal,
                hooks: {},
                next: []
            }

            if (stateModel.hooks) {
                state.hooks.before = stateModel.hooks.before
                state.hooks.after = stateModel.hooks.after
            }

            if (stateModel.next) {
                for (const item of stateModel.next) {
                    state.next.push(item.code ? item.code.toLowerCase() : item.toLowerCase())
                }
            }
            entity.states.push(state)
        }
    }

    if (model.children) {
        entity.children = []

        for (const child of model.children) {
            let item = await this.get(child, context)
            entity.children.push(item)
        }
    }

    return entity
}

const defaultStates = () => {
    return [{
        code: 'new',
        name: 'New',
        isFirst: true,
        next: ['wip', 'done', 'canceled']
    }, {
        code: 'rework',
        name: 'Rework',
        next: ['wip', 'done', 'canceled']
    }, {
        code: 'wip',
        name: 'In Progress',
        next: ['done', 'blocked', 'rework', 'canceled']
    }, {
        code: 'blocked',
        name: 'Blocked',
        next: ['wip', 'done', 'canceled']
    }, {
        code: 'done',
        name: 'Complete',
        isFinal: true,
        next: ['rework']
    }, {
        code: 'canceled',
        name: 'Canceled',
        isFinal: true,
        isCancelled: true,
        next: ['new']
    }]
}

exports.create = async (model, context) => {
    let entity = await exports.get(model, context)

    if (entity) {
        throw new Error('work flow type code ' + model.code + ' already exists')
    }

    entity = new db.workflow({
        code: model.code.toLowerCase(),
        name: model.name || model.code,
        tenant: context.tenant
    })

    model.states = model.states || defaultStates()

    await set(model, entity, context)
    return entity.save()
}

exports.update = async (id, model, context) => {
    let entity = await this.get(id, context)
    await set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    let where = {
        tenant: context.tenant
    }
    const items = await db.workflow.find(where).populate('states')

    return {
        items: items,
        count: items.length
    }
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return db.workflow.findById(query).populate(populate)
        } else {
            return db.workflow.findOne({
                code: query.toLowerCase(),
                tenant: context.tenant
            }).populate(populate)
        }
    } else if (query.id) {
        return db.workflow.findById(query.id).populate(populate)
    } else if (query.code) {
        return db.workflow.findOne({
            code: query.code.toLowerCase(),
            tenant: context.tenant
        }).populate(populate)
    }

    return null
}
