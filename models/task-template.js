const mongoose = require('mongoose')

module.exports = {
    code: String, // template code
    name: String, // template code

    subject: String, // {{}}
    description: String, // {{}}
    assignee: String, // {{}}

    size: Number,
    priority: Number,
    processing: String,
    hooks: [],
    type: { type: String },
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'workflow' },
    meta: Object, // {{}}

    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'taskTemplate' }],

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
