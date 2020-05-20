'use strict'
const db = require('../models')

const set = (model, entity, context) => {
    if (model.name) {
        entity.name = model.name
    }

    if (model.code) {
        entity.code = model.code.toLowerCase()
    }

    if (model.isFinal !== undefined) {
        entity.isFinal = model.isFinal
    }

    return entity
}

const getById = async (id, context) => {
    return db.taskState.findOne({
        where: {
            id: id
        }
    })
}

const getByCode = async (code, context) => {
    let entity = await db.taskState.findOne({
        where: {
            code: code.toLowerCase()
        }
    })

    if (entity) {
        return entity
    }

    entity = new db.taskState({
        code: code.toLowerCase(),
        name: code,
        isFinal: false
    })

    return entity.save()
}

exports.create = async (model, context) => {
    let entity = await exports.get(model, context)
    if (entity) {
        set(model, entity, context)
        return entity.save()
    }

    entity = new db.taskState({
        code: model.code.toLowerCase(),
        name: model.name
    })

    entity = await entity.save()

    return getById(entity.id)
}

exports.update = async (id, model, context) => {
    let entity = await db.taskState.findById(id)
    set(model, entity, context)
    return entity.save()
}

exports.search = async (query, page, context) => {
    const items = await db.taskState.findAll({
        where: query
    })

    return {
        items: items,
        count: items.length
    }
}

exports.get = async (query, context) => {
    if (typeof query === 'string') {
        if (query.isObjectId()) {
            return getById(query.toObjectId(), context)
        } else {
            return getByCode(query, context)
        }
    }

    if (query.id) {
        return getById(query.id, context)
    }

    if (query.code) {
        return getByCode(query.code, context)
    }

    return null
}
