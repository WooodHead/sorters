import cheerio from 'cheerio'
import pretty from 'pretty'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'

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

describe('index', () => {
    it('displays', async () => {
        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })
})
