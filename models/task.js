const mongoose = require('mongoose')

module.exports = {
    code: String,
    type: { type: String },
    subject: String,
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

    priority: Number,
    order: Number,
    percentage: Number,

    meta: Object,

    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        size: Number,
        burnt: Number,
        roles: [String]
    }],

    status: {
        code: String,
        name: String,
        isFirst: Boolean,
        isCancelled: Boolean,
        isFinal: Boolean,
        next: [String]
    },

    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'workflow' },

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },
    dependsOn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }],
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'task' }],

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    release: { type: mongoose.Schema.Types.ObjectId, ref: 'release' },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'sprint' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
