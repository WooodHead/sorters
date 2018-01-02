const express = require('express')
const Ooth = require('ooth')
const oothLocal = require('ooth-local')
const oothFacebook = require('ooth-facebook')
const oothGoogle = require('ooth-google')
const mail = require('./mail')
const OothMongo = require('ooth-mongo')
const {ObjectId} = require('mongodb')

module.exports = async function start(app, db, settings) {

    const ooth = new Ooth({
        sharedSecret: settings.sharedSecret,
        path: settings.oothPath,
    })
    const oothMongo = new OothMongo(db, ObjectId)

    await ooth.start(app, oothMongo)

    const sendMail = mail(settings.mailgun)
    ooth.use('local', oothLocal({
        onRegister({email, verificationToken, _id}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Welcome to Sorters Club',
                body: `Thank you for joining Sorters Club!`,
                html: `Thank you for joining Sorters Club!`,
            })
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Verify your Sorters Club email address',
                body: `Please verify your Sorters Club email by opening the following url: ${settings.url}/verify-email?token=${verificationToken}&userId=${_id}.`,
                html: `Please verify your Sorters Club email by opening the following url: ${settings.url}/verify-email?token=${verificationToken}&userId=${_id}.`,
            })
        },
        onGenerateVerificationToken({email, verificationToken}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Verify your Sorters Club email address',
                body: `Please verify your Sorters Club email by opening the following url: ${settings.url}/verify-email?token=${verificationToken}&userId=${_id}.`,
                html: `Please verify your Sorters Club email by opening the following url: ${settings.url}/verify-email?token=${verificationToken}&userId=${_id}.`,
            })
        },
        onSetEmail({email, verificationToken, _id}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Verify your email address',
                body: `Please verify your email by opening the following url: ${settings.ul}/verify-email?token=${verificationToken}&userId=${_id}.`,
                html: `Please verify your email by opening the following url: ${settings.url}/verify-email?token=${verificationToken}&userId=${_id}.`,
            })
        },
        onVerify({email}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Sorters Club Address verified',
                body: `Your Sorters Club email address has been verified.`,
                html: `Your Sorters Club email address has been verified.`,
            })
        },
        onForgotPassword({email, passwordResetToken, _id}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Reset Sorters Club password',
                body: `Reset your password for Sorters Club on the following page: ${settings.url}/reset-password?token=${passwordResetToken}&userId=${_id}.`,
                html: `Reset your password for Sorters Club on the following page: ${settings.url}/reset-password?token=${passwordResetToken}&userId=${_id}.`,
            })
        },
        onResetPassword({email}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Sorters Club Password Reset',
                body: 'Your password for Sorters Club has been reset.',
                html: 'Your password for Sorters Club has been reset.'
            })
        },
        onChangePassword({email}) {
            sendMail({
                from: settings.mail.from,
                to: email,
                subject: 'Sorters Club Password Changed',
                body: 'Your password for Sorters Club has been changed.',
                html: 'Your password for Sorters Club has been changed.'
            })
        }
    }))

    ooth.use('facebook', oothFacebook(settings.facebook))

    ooth.use('google', oothGoogle(settings.google))

}
