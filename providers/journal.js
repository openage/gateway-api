const config = require('config').get('providers')['insight']
const client = new (require('node-rest-client-promise')).Client()

const dispatch = async (journal, context) => {
    if (!config || !config.url) {
        return
    }

    const args = {
        headers: {
            'Content-Type': 'application/json'
        },
        data: journal
    }

    if (context.role) {
        args.headers['x-role-key'] = context.role.key
    } else if (context.user && context.user.role) {
        args.headers['x-role-key'] = context.user.role.key
    }

    if (context.session) {
        args.headers['x-session-id'] = context.session.id
    }

    if (context.id) {
        args.headers['x-context-id'] = context.id
    }

    let url = `${config.url}/journals`

    context.logger.debug(`sending payload to url: ${url}`)

    let response = await client.postPromise(url, args)
    if (!response.data.isSuccess) {
        context.logger.error(response.data.journal || response.data.error)
        throw new Error(`invalid response from insight`)
    }
}

exports.start = (entity, entityType, type, context) => {
    let journalEntity

    // if (!entityType) {
    journalEntity = entity
    // } else if (typeof entityType === 'string') {
    //     journalEntity = {
    //         id: entity.id,
    //         code: entity.code,
    //         name: entity.name,
    //         type: entityType
    //     }

    //     if (entity.organization) {
    //         journalEntity.organization = {
    //             code: entity.organization.code
    //         }
    //     }
    // } else { // assuming it is function
    //     journalEntity = entityType(entity, context)
    // }

    let journal = {
        entity: journalEntity,
        type: type,
        changes: []
    }

    let builder = {
        add: (field, value, oldValue) => {
            if (value == oldValue) {
                return builder
            }

            journal.changes.push({
                field: field,
                value: value,
                oldValue: oldValue,
                type: value ? typeof value : typeof oldValue
            })

            return builder
        },

        end: async (messge) => {
            journal.messge = messge

            return dispatch(journal, context)
        }
    }
    return builder
}
