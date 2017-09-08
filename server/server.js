const next = require('next')
const api = require('./api').start
const express = require('express')

module.exports = async (settings, dev) => {
    try {
        console.info('Starting server...')

        const app = express()

        await api(app, settings)

        const nextApp = next({
            dev
        })
        const handle = nextApp.getRequestHandler()

        await nextApp.prepare()

        app.get('/u/:username', (req, res) => {
            nextApp.render(req, res, '/user', Object.assign({}, req.params, req.query))
        })

        app.get('/u/:username/:view', (req, res) => {
            nextApp.render(req, res, `/user/${req.params.view}`, Object.assign({}, req.params, req.query))
        })

        app.get('*', (req, res) => {
            return handle(req, res)
        })

        const server = await app.listen(settings.port)

        console.info(`Online at ${settings.url}:${settings.port}`)

        return server
    } catch (e) {
        console.error(e)
    }
}

