import cheerio from 'cheerio'
import {pretty} from './utils'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {sleep} from './utils'

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

describe('register', () => {
    it('displays', async () => {
        const browserPage = await browser.newPage()
        const response = await browserPage.goto(`http://localhost:3000/register`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const pageHtml = page.html()
        const html = pretty(pageHtml)
        expect(html).toMatchSnapshot()
    })
})
