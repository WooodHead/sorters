import cheerio from 'cheerio'
import {pretty} from './utils'
import {MongoClient, ObjectID} from 'mongodb'
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

describe('users', () => {
    it('displays', async () => {
        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000/users`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays a user', async () => {        
        const Users = db.collection('users')
        const user = await Users.insertOne({
            local: {
                username: 'test'
            }
        })

        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000/users`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays a user with data', async () => {        
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)

        const status = await browserPage.open(`http://localhost:3000/users`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

})
