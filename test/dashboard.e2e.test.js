import cheerio from 'cheerio'
import {pretty} from './utils'
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
        const browserPage = await browser.newPage()
        const response = await browserPage.goto(`http://localhost:3000/account`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const pageHtml = page.html()
        const html = pretty(pageHtml)
        expect(html).toMatchSnapshot()
    })

    it('displays when logged', async () => {
        const browserPage = await browser.newPage()

        await generateAndLogUser(browserPage)

        const response = await browserPage.goto(`http://localhost:3000/account`)
        expect(response.status()).toBe(200)
        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const pageHtml = page.html()
        const html = pretty(pageHtml)
        expect(html).toMatchSnapshot()
    })
})
