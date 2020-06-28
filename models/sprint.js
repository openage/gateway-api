const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    description: String,

    externalId: String,

    size: Number,
    burnt: Number,

    plan: { start: Date, finish: Date },
    actual: { start: Date, finish: Date },

    isClosed: Boolean,

    members: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        size: Number,
        burnt: Number,
        time: Number,
        roles: [String],
        status: String // active, inactive
    }],

    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
