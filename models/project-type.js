/* eslint-disable no-undef */
'use strict'
const mongoose = require('mongoose')

module.exports = {
    code: String,
    name: String,
    description: String,

    roles: [{ code: String, name: String, permissions: [String] }],
    workflows: [{ type: mongoose.Schema.Types.ObjectId, ref: 'workflow' }],
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
