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
        hooks: {
            before: String,
            after: String
        },
        isFirst: Boolean,
        isPaused: Boolean,
        isCancelled: Boolean,
        isFinal: Boolean,

        next: [String]
    }],

    children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'workflow' }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }

}
