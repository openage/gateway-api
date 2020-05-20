'use strict'
var handlebars = require('handlebars')
var moment = require('moment')
var qrCode = require('qr-image')
var BarCode = require('barc')
var Datauri = require('datauri')

var formats = require('config').get('formats')

handlebars.registerHelper('date', function (date) {
    if (!date) {
        return ''
    }
    return moment(date).format(formats.date)
})

// handlebars.registerHelper('fulldate', function (date) {
//     if (!date) {
//         return ''
//     }
//     return moment(date).format('MMMM DD, YYYY')
// })

handlebars.registerHelper('time', function (date) {
    if (!date) {
        return ''
    }
    return moment(date).format('hh:mm:ss')
})

handlebars.registerHelper('capitalize', function (str) {
    if (!str) {
        return ''
    }
    return str.replace(/^\w/, c => c.toUpperCase())
})

handlebars.registerHelper('inWords', function (num) {
    var a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen ']
    var b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

    if ((num = num.toString()).length > 9) return 'overflow'
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
    if (!n) return; var str = ''
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : ''
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : ''
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : ''
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : ''
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : ''
    return str
})

handlebars.registerHelper('eq', function (a, b, opts) {
    if (a == b) { // Or === depending on your needs
        return opts.fn(this)
    } else {
        return opts.inverse(this)
    }
})

handlebars.registerHelper('qrcode', function (code) {
    if (!code) {
        return ''
    }
    var buffer = qrCode.imageSync(code)

    var datauri = new Datauri()
    var uri = datauri.format('.png', buffer)
    return uri.content
})

handlebars.registerHelper('minhrsConversion', function (mins) {
    if (!mins) {
        return ''
    }

    let text
    if (mins >= 60) {
        if (mins === 60) {
            text = `1 hours`
        }

        let rem = mins % 60
        let hrs = (mins - rem) / 60
        text = `${hrs} hours ${rem} minutes`
    } else {
        text = `${mins} minutes`
    }

    return text
})

handlebars.registerHelper('ge', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a >= b) ? next.fn(this) : next.inverse(this)
})

// greater than
handlebars.registerHelper('gt', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a > b) ? next.fn(this) : next.inverse(this)
})

handlebars.registerHelper('lt', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a < b) ? next.fn(this) : next.inverse(this)
})

// not equal
handlebars.registerHelper('ne', function (a, b) {
    var next = arguments[arguments.length - 1]
    return (a !== b) ? next.fn(this) : next.inverse(this)
})

handlebars.registerHelper('barcode', function (code, options) {
    if (!code) {
        return ''
    }

    var barCode = new BarCode()
    var type = options.hash.type || 'code128'
    var buffer = barCode[type]('' + code,
        options.hash.width || 300,
        options.hash.height || 100,
        options.hash.angle || 0)

    var datauri = new Datauri()
    var uri = datauri.format('.png', buffer)
    return uri.content
})

exports.formatter = function (format) {
    var template = handlebars.compile(format)
    return {
        inject: function (data) {
            return template(data)
        }
    }
}
