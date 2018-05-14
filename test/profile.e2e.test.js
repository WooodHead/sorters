import cheerio from 'cheerio'
import {pretty} from './utils'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {generateAndLogUser, setUserData} from './fixtures'

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

describe('profile', () => {
    it('displays', async () => {
        const browserPage = await browser.newPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        
        const response = await browserPage.goto(`http://localhost:3000/account/profile`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })
})
