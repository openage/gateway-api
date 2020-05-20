module.exports = [{
    url: '/',
    post: { parameters: ['x-role-key'] },
    get: { parameters: ['x-role-key'] }
}, {
    url: '/{id}',
    put: { parameters: ['x-role-key'] }
}]
