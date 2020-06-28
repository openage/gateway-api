const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'projectType' },
    description: String,

    entity: {
        id: String,
        name: String,
        type: { type: String }
    },

    externalId: String,

    size: Number,
    burnt: Number,

    plan: { start: Date, finish: Date },
    actual: { start: Date, finish: Date },

    isClosed: Boolean,

    velocity: Number,

    config: {
        task: {
            lastNo: Number,
            provider: {
                type: { type: String },
                config: Object,
                lastSync: Date
            }
        },
        sprint: {
            lastNo: Number,
            schedule: {
                period: Number, // 2
                type: { type: String } // week
            }
        },
        release: {
            lastNo: {
                major: Number,
                minor: Number,
                patch: Number

            }
        }
    },

    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        size: Number,
        burnt: Number,
        time: Number,
        roles: [String],
        status: String // active, inactive
    }],

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'project' }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
