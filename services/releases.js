'use strict'

const db = require('../models')
const projects = require('./projects')
const workflowTypes = require('./workflows')
const states = require('./states')

// const approverService = require('./approvers')

const moment = require('moment')

const include = [{
    model: db.state,
    as: 'states',
    include: [{
        model: db.stateType,
        as: 'type'
    }, {
        model: db.member,
        as: 'members',
        include: [{
            model: db.user,
            as: 'user'
        }, {
            model: db.role,
            as: 'role'
        }]
    }]
}, {
    model: db.member,
    as: 'members',
    include: [{
        model: db.user,
        as: 'user'
    }, {
        model: db.role,
        as: 'role'
    }]
}, {
    model: db.approver,
    as: 'approvers',
    include: [{
        model: db.user,
        as: 'user'
    }]
}, {
    model: db.task,
    as: 'tasks'
}, {
    model: db.workflowType,
    as: 'workflowType'
}, {
    model: db.project,
    as: 'project'
}]

const set = async (model, entity, context) => {
    let plan = false
    if (model.plan) {
        if (model.plan.start && (!entity.plan.start || !moment(entity.plan.start).isSame(model.plan.start))) {
            entity.plan.start = model.plan.start
            plan = true
        }
        if (model.plan.finish) {
            entity.plan.finish = model.plan.finish
        }
    }

    if (model.actual) {
        if (model.actual.start && (!entity.actual.start || !moment(entity.actual.start).isSame(model.actual.start))) {
            entity.actual.start = model.actual.start
            plan = true
        }
        if (model.actual.finish) {
            entity.actual.finish = model.actual.finish
        }
    }

    // if (model.approvers && model.approvers.length) {
    //     entity.approvers = entity.approvers || []
    //     for (const item of model.approvers) {
    //         await approverService.getOrCreate({
    //             user: item,
    //             release: entity
    //         }, context)
    //     }
    // }

    // if (model.code !== undefined) {
    //     entity.code = model.code
    // }

    if (model.isClosed) {
        entity.isClosed = model.isClosed
    }

    if (model.name !== undefined) {
        entity.name = model.name
    }

    if (model.description !== undefined) {
        entity.description = model.description
    }

    if (plan && entity.states && entity.states.length) {
        let firstState = entity.states.find(i => i.type.isFirst)
        firstState.isCurrent = true
        await firstState.save()

        entity.plan.finish = await states.plan(firstState, entity.plan.start, context)
    }

    return entity
}

const create = async (model, context) => {
    let project = await projects.get(model.project, context)

    if (model.code) {
        model.code = model.code.toLowerCase()
    } else if (model.type) {
        switch (model.type.toLowerCase()) {
        case 'major':
            model.code = await projects.newMajorReleaseNo(project, context)
            break

        case 'minor':
            model.code = await projects.newMinorReleaseNo(project, context)
            break

        case 'patch':
            model.code = await projects.newPatchReleaseNo(project, context)
            break

        default:
            throw new Error(`release type: ${model.type} is not supported`)
        }
    }

    let entity = await db.release.findOne({
        where: {
            code: model.code,
            projectId: project.id
        }
    })

    if (entity) {
        throw new Error('release version ' + model.code + ' already exists')
    }

    let workflowType = await workflowTypes.get(model.type, context)

    if (!workflowType) {
        throw new Error('workflow type ' + model.type + ' does not exist')
    }

    entity = new db.release({
        code: model.code,
        projectId: project.id,
        workflowTypeId: workflowType.id
    })
    await entity.save()

    entity.states = []
    entity.members = []

    model.actual = model.actual || {}
    model.actual.start = model.actual.start || new Date()

    for (const stateType of workflowType.stateTypes) {
        let state = new db.state({
            typeId: stateType.id,
            releaseId: entity.id
        })

        state.type = stateType

        await state.save()
        entity.states.push(state)
    }

    await set(model, entity, context)

    for (const projectMember of project.members) {
        let member = new db.member({
            roleId: projectMember.role.id,
            userId: projectMember.user.id,
            releaseId: entity.id
        })

        await member.save()
        entity.members.push(member)
    }

    await entity.save()

    return get({ id: entity.id }, context)
}

const update = async (id, model, context) => {
    let entity = await getById(id, context)
    set(model, entity, context)
    return entity.save()
}

const search = async (query, page, context) => {
    let where = {}

    if (query.projectId) {
        where.projectId = query.projectId
    }

    if (query.statusId) {
        where.statusId = query.statusId
    }

    if (query.isClosed !== undefined) {
        where.isClosed = true
    }

    // if (query.actual.start) {
    //     where.actual.start = {
    //         [Op.gte]: moment(query.actual.start).startOf('day').toDate(),
    //         [Op.lt]: moment(query.actual.start).endOf('day').toDate()
    //     }
    // }

    // if (query.isOngoing !== undefined) {
    //     if (query.isOngoing) {
    //         where.actual.start = {
    //             [Op.ne]: null
    //         }
    //         where.isClosed = null
    //     } else {
    //         where.actual.start = null
    //     }
    // }

    let sql = {
        where: where,
        include: [{
            model: db.project,
            as: 'project'
        }, {
            model: db.workflowType,
            as: 'workflowType'
        }, {
            model: db.state,
            as: 'states',
            include: [{
                model: db.stateType,
                as: 'type'
            }]
        }],
        order: [
            ['plan.finish', 'DESC']
        ]
    }

    if (page) {
        sql.offset = page.skip
        sql.limit = page.limit
    }

    return {
        items: await db.release.findAll(sql),
        count: await db.release.count({ where: where })
    }
}

const getById = async (id, context) => {
    let release = await db.release.findOne({
        where: {
            id: id
        },
        include: include
    })

    return release
}

const getByCode = async (code, project, context) => {
    if (!project.id) {
        project = await projects.get(project, context)
    }

    let entity = await db.release.findOne({
        where: {
            code: code.toLowerCase(),
            projectId: project.id
        },
        include: include
    })

    if (!entity) {
        throw new Error(`release version '${code}' does not exists`)
    }

    return entity
}

const get = async (query, context) => {
    // context.logger.debug('services/tasks:get')

    if (!query) {
        return null
    }

    if (typeof query === 'string' && query.isObjectId()) {
        return getById(query, context)
    }

    if (query.id) {
        return getById(query.id, context)
    }

    if (query.code && query.project) {
        return getByCode(query.code, query.project, context)
    }

    return null
}

exports.get = get
exports.getById = getById
exports.getByCode = getByCode
exports.create = create
exports.search = search
exports.update = update
