const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    description: String,

    estimate: Number, // in minutes
    meta: Object,

    states: [{
        code: String,
        action: String,
        name: String,
        estimate: Number, // in minutes
        hooks: [{
            trigger: {
                when: String, // values - before, after(default),
                entity: String,
                action: String
            },
            actions: [{
                handler: String, // values - frontend, backend (default)
                type: { type: String },
                config: Object // { "url": ":drive/docs/idcard/${data.code}", "action": "GET", "headers": {"x-role-key": "${context.role.key}" }
            }]
        }],
        isFirst: Boolean,
        isPaused: Boolean,
        isCancelled: Boolean,
        isFinal: Boolean,
        permissions: [String],
        next: [String]
    }],

    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'workflow' }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }

}
