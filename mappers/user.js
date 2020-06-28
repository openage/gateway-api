'use strict'

const setProfile = (profile, context) => {
    if (!profile) {
        return { pic: {} }
    }
    let model = {
        firstName: profile.firstName,
        lastName: profile.lastName
    }

    if (profile.pic) {
        model.pic = {
            url: profile.pic.url,
            thumbnail: profile.pic.thumbnail
        }
    }

    return model
}

exports.toModel = (entity, context) => {
    if (!entity) {
        return
    }
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    const model = {
        id: entity.id,
        code: entity.code,
        phone: entity.phone,
        email: entity.email,
        status: entity.status,
        profile: setProfile(entity.profile, context),
        recentLogin: entity.recentLogin
    }

    // todo add config

    return model
}

exports.toSummary = (entity, context) => {
    if (!entity) {
        return
    }
    if (!entity._doc) {
        return {
            id: entity.toString()
        }
    }
    return {
        id: entity.id,
        code: entity.code,
        email: entity.email,
        profile: setProfile(entity.profile, context)
    }
}
