const mongoose = require('mongoose')

module.exports = {
    date: Date,
    activity: String,
    comment: String,
    minutes: Number,

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'task' },
    sprint: { type: mongoose.Schema.Types.ObjectId, ref: 'sprint' },
    release: { type: mongoose.Schema.Types.ObjectId, ref: 'release' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' },

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }

}
