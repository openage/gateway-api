
module.exports = require('./importer-base')({
    sheetName: 'Tasks',
    columnMaps: {
        default: [{
            type: 'date',
            label: 'Planed Start Date',
            key: 'plan-start'
        }, {
            type: 'date',
            label: 'Planed End Date',
            key: 'plan-end'
        }, {
            type: 'date',
            label: 'Actual Start Date',
            key: 'actual-start'
        }, {
            type: 'date',
            label: 'Actual End Date',
            key: 'actual-end'
        }, {
            type: 'string',
            label: 'Project Code',
            key: 'project-code'
        }, {
            type: 'string',
            label: 'Release Code',
            key: 'release-code'
        }, {
            type: 'string',
            label: 'Sprint Code',
            key: 'sprint-code'
        }, {
            key: 'string',
            label: 'Entity Id',
            type: 'entity-id'
        }, {
            type: 'string',
            label: 'Entity Code',
            key: 'entity-code'
        }, {
            type: 'string',
            label: 'Entity Name',
            key: 'Entity-name'
        }, {
            type: 'string',
            label: 'Code',
            key: 'code'
        }, {
            type: 'string',
            label: 'Subject',
            key: 'subject'
        }, {
            type: 'string',
            label: 'Description',
            key: 'description'
        }, {
            type: 'number',
            label: 'Priority',
            key: 'priority'
        }, {
            type: 'number',
            label: 'Size',
            key: 'size'
        }, {
            type: 'string',
            label: 'Status',
            key: 'status'
        }, {
            type: 'string',
            label: 'Assignee',
            key: 'assignee'
        }, {
            type: 'string',
            label: 'Workflow',
            key: 'workflow-code'
        }]
    }
})
