const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    label: String,
    estimate: Number, // in minutes
    icon: String,
    isFirst: Boolean,
    isCancelled: Boolean,
    isFinal: Boolean,

    next: [{ type: mongoose.Schema.Types.ObjectId, ref: 'state' }],
    workflow: { type: mongoose.Schema.Types.ObjectId, ref: 'workflow' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
