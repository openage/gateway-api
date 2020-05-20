const mongoose = require('mongoose')

module.exports = {
    role: {
        id: String,
        key: String,
        code: String,
        permissions: [{
            type: String
        }]
    },
    email: String,
    phone: String,
    code: String,
    profile: {
        firstName: String,
        lastName: String,
        gender: String,
        dob: Date,
        pic: {
            url: String,
            thumbnail: String
        }
    },

    config: Object,

    //     config: {
    //         channel: {
    //             provider: { type: String }, // slack
    //             code: String, // user code
    //             token: String
    //         },
    //         tasks: {
    //             provider: { type: String }, // jira
    //             code: String, // jira id
    //             token: String
    //         }
    //     },

    status: String,
    lastSeen: Date,

    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'organization' },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'tenant' }
}
