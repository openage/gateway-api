const db = require('../models')

const moment = require('moment')

const getNextStates = async (state, context) => {
    let steps = await db.stateTypeStep.findAll({
        where: { stateTypeId: state.type.id }
    })

    let typeIds = []

    steps.forEach(step => {
        typeIds.push(step.nextId)
    })

    let states = await db.state.findAll({
        where: {
            typeId: typeIds,
            releaseId: state.releaseId
        },
        include: [{
            model: db.stateType,
            as: 'type'
        }]
    })

    return states
}

const plan = async (state, startDate, context) => {
    state.plan.start = startDate
    let endDate = moment(state.actual.start || state.plan.start).add(state.type.estimatedDuration, 'minutes').toDate()
    state.plan.finish = endDate
    await state.save()
    return planNextSteps(state, context)
}

const planNextSteps = async (state, context) => {
    let endDate = state.plan.finish
    let nextStates = await getNextStates(state, context)
    for (const nextState of nextStates) {
        let plannedEndDate = await plan(nextState, state.actual.finish || state.plan.finish, context)

        if (moment(plannedEndDate).isAfter(endDate)) {
            endDate = plannedEndDate
        }
    }

    return endDate
}

const set = async (model, entity, context) => {
    let shouldReplan = false
    if (model.plan) {
        if (model.plan.start && (!entity.plan.start || !moment(entity.plan.start).isSame(model.plan.start))) {
            entity.plan.start = model.plan.start
            entity.plan.finish = moment(entity.plan.start).add(entity.type.estimatedDuration, 'minutes').toDate()
            shouldReplan = true
        }

        if (model.plan.finish && (!entity.plan.finish || !moment(entity.plan.finish).isSame(model.plan.finish))) {
            entity.plan.finish = model.plan.finish
            shouldReplan = true
        }
    }

    if (model.actual) {
        if (model.actual.start && (!entity.actual.start || !moment(entity.actual.start).isSame(model.actual.start))) {
            entity.plan.finish = moment(model.actual.start).add(entity.type.estimatedDuration, 'minutes').toDate()
            entity.actual.start = model.actual.start
            shouldReplan = true
        }

        if (model.actual.finish && (!entity.actual.finish || !moment(entity.actual.finish).isSame(model.actual.finish))) {
            entity.actual.finish = model.actual.finish
            shouldReplan = true
        }
    }

    if (model.isCurrent !== undefined) {
        entity.isCurrent = model.isCurrent
    }

    if (model.percentage !== undefined) {
        entity.percentage = model.percentage
    }

    if (shouldReplan && entity.type.estimatedDuration) {
        await planNextSteps(entity, context)
    }

    return entity
}

exports.update = async (id, model, context) => {
    let entity = await db.state.findOne({
        where: { id: id },
        include: [{
            model: db.stateType,
            as: 'type',
            include: [{
                model: db.stateTypeStep,
                as: 'nextStates'
            }]
        }]
    })
    await set(model, entity, context)
    return entity.save()
}

exports.plan = plan
