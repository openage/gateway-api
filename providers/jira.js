const request = require('request')
const jiraConfig = require('config').get('providers.jira')

const rootUrl = jiraConfig.url

const getIssues = async (config) => {
    const options = {
        method: 'GET',
        url: `${rootUrl}/search?jql=project=${config.code}`,
        auth: {
            user: `${config.jira_username}`,
            pass: `${config.jira_password}`
        },
        headers: {
            'Accept': 'application/json'
        }
    }

    return new Promise((resolve, reject) => {
        return request(options, (error, response, body) => {
            if (error) {
                console.error('error:', error)
                return reject(error)
            }
            return resolve(JSON.parse(body).issues.map(i => {
                return {
                    externalId: i.key.toLowerCase(),
                    subject: i.fields.summary
                }
            }))
        })
    })
}

exports.getIssues = getIssues
