import cheerio from 'cheerio'
import pretty from 'pretty'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {generateAndLogUser} from './fixtures'
import {request} from './utils'

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

describe('goals', () => {
    it('displays', async () => {
        const browserPage = await browser.createPage()
        
        await generateAndLogUser(browserPage)

        await request(browserPage, `http://localhost:3000/graphql`, 'POST', {
            query: `
                mutation($entry: NewEntryInput!) {
                    createEntry(entry: $entry) {
                        _id
                    }
                }
            `,
            variables: {
                entry: {
                    title: 'Hello World',
                    url: 'http://www.example.com',
                    description: 'Lorem ipsum',
                    goalTitles: ['Goal', 'Goal - doing'],
                },
            },
        })

        const status = await browserPage.open(`http://localhost:3000/account/journal`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })
})