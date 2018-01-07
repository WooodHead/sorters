import cheerio from 'cheerio'
import {pretty} from './utils'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {generateAndLogUser, setUserData, getGoalIds} from './fixtures'
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

describe('user', () => {
    it('displays', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        
        const status = await browserPage.open(`http://localhost:3000/u/test`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays goals', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        
        const status = await browserPage.open(`http://localhost:3000/u/test/goals`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays journal', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        const goalIds = await getGoalIds(browserPage)
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
                    goalIds,
                },
            },
        })
        
        const status = await browserPage.open(`http://localhost:3000/u/test/journal`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays profile', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        
        const status = await browserPage.open(`http://localhost:3000/u/test/profile`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays reads', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)
        
        const status = await browserPage.open(`http://localhost:3000/u/test/reads`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

})