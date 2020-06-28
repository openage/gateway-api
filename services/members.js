'use strict'
const db = require('../models')
const userGetter = require('./users')
const taskGetter = require('./tasks')

const projectGetter = require('./projects')
const releaseGetter = require('./releases')
const sprintGetter = require('./sprints')
// const stateGetter = require('./workflow-states')

// const update = (members, user, roles, context) => {
//     members = members || []

//     if (roles && roles.length) {
//         var member = members.find(m => m.user.id === user.id)

//         if (!member) {
//             member = {
//                 user: user,
//                 size: 0,
//                 burnt: 0
//             }

//             members.push(member)
//         }

//         member.roles = roles
//     } else {
//         members = members.filter(m => m.user.id !== user.id)
//     }

//     return members
// }

exports.update = async (entity, members, context) => {
    const log = context.logger.start('services/members:update')

    entity.members = entity.members || []

    for (const item of members) {
        let user = await userGetter.get(item.user, context)
        if (!user) {
            continue
        }

        let member = entity.members.find(m => m.user.id === user.id)

        if (!member) {
            member = {
                user: user,
                size: item.size,
                burnt: item.burnt,
                time: item.time,
                roles: item.roles,
                status: item.status || 'active'
            }

            entity.members.push(member)
        }

        member.size = item.size || member.size
        member.burnt = item.burnt || member.burnt
        member.time = item.time || member.time
        if (item.roles && item.roles.length) {
            member.roles = item.roles
        }

        member.status = item.status || member.status
    }

    entity.markModified('members')
    log.end()
}

// exports.update = async (id, model, context) => {
//     let user = await userGetter.get(model.user, context)

//     let cascade = model.roles && model.roles.length

//     if (model.task) {
//         let task = await taskGetter.get(model.release, context)
//         task.members = update(task.members, user, model.roles, context)
//         await task.save()

//         if (task.parent) {
//             let parentTask = await taskGetter.get(task.parent, context)

//             parentTask.members = update(parentTask.members, user, model.role, context)
//             await parentTask.save()
//         }

//         if (!cascade) {
//             return
//         }

//         model.sprint = task.sprint
//         model.release = task.release
//         model.project = task.project
//     }

//     if (model.sprint) {
//         let sprint = await sprintGetter.get(model.sprint, context)
//         sprint.members = update(sprint.members, user, model.roles, context)
//         await sprint.save()

//         if (!cascade) {
//             return
//         }
//         model.project = sprint.project
//     }

//     if (model.release) {
//         let release = await releaseGetter.get(model.release, context)
//         release.members = update(release.members, user, model.roles, context)
//         await release.save()

//         if (!cascade) {
//             return
//         }

//         model.project = release.project
//     }

//     if (model.project) {
//         let project = await projectGetter.get(model.project, context)

//         project.members = update(project.members, user, model.roles, context)
//         await project.save()

//         if (!cascade) {
//             return
//         }

//         if (project.parent) {
//             exports.update({
//                 project: project.parent,
//                 user: user,
//                 roles: model.roles
//             })
//         }

//         // if (project.children && project.children.length) {
//         //     for (const item of project.children) {
//         //         let childProject = await projectGetter.get(item, context)
//         //         childProject.members = update(childProject.members, user, childProject.roles, context)
//         //         await childProject.save()
//         //     }
//         // }
//     }
// }
