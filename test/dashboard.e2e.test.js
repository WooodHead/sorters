import cheerio from 'cheerio'
import pretty from 'pretty'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import setCookie from 'set-cookie-parser'
import {generateAndLogUser} from './fixtures'

let db
let browser

beforeAll(async () => {
    const res = await setup()
    db = res.db
    browser = res.browser
})

afterEach(async () => {
    await db.dropDatabase()    
})

afterAll(async () => {
    await teardown({db, browser})
})

describe('dashboard', () => {
    it('redirects when unlogged', async () => {
        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000/dashboard`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const pageHtml = page.html()
        const html = pretty(pageHtml)
        expect(html).toMatchSnapshot()
    })

    it('displays when logged', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)

        const status = await browserPage.open(`http://localhost:3000/dashboard`)
        expect(status).toBe('success')
        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const pageHtml = page.html()
        const html = pretty(pageHtml)
        expect(html).toMatchSnapshot()
    })
})
