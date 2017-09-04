import cheerio from 'cheerio'
import pretty from 'pretty'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {generateAndLogUser} from './fixtures'

let app
let db
let browser

beforeAll(async () => {
    const res = await setup()
    app = res.app
    db = res.db
    browser = res.browser
})

afterEach(async () => {
    await db.dropDatabase()    
})

afterAll(async () => {
    await teardown({db, app, browser})
})

describe('goals', () => {
    it('displays', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage, db)
        
        const status = await browserPage.open(`http://localhost:3000/goals`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })
})