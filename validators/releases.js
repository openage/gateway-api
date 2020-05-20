exports.canCreate = async (req) => {
    if (!req.body) {
        return 'REQUEST_INVALID'
    }

    if (!req.body.project) {
        return 'project required'
    } else if (!req.body.project.id) {
        return 'project required'
    } else if (!req.body.project.code) {
        return 'project required'
    }
}
