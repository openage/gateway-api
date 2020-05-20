'use strict'
global.Promise = require('bluebird')
global.processSync = true
process.env.APP = 'listener'

const logger = require('@open-age/logger')('bin/listener').start('booting')
const offline = require('@open-age/offline-processor')
require('../helpers/string')
require('../helpers/number')
require('../helpers/toObjectId')

logger.info(`environment: ${process.env.NODE_ENV}`)
require('../settings/database').configure(logger)
require('../settings/offline-processor').configure(logger)
offline.listen(process.env.QUEUE_NAME, require('@open-age/logger')('LISTEN'))

logger.end()
