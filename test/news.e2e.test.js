import cheerio from 'cheerio'
import pretty from 'pretty'
import {ObjectID} from 'mongodb'
import {setup, teardown} from './setup'
import {generateAndLogUser, setUserData} from './fixtures'
import {request} from './utils'

let db
let browser

beforeAll(async () => {
    const res = await setup()
    db = res.db
    browser = res.browser
})


afterAll(async () => {
    await teardown({db, browser})
})

describe('news', () => {
    afterEach(async () => {
        await db.dropDatabase()    
    })

    it('displays', async () => {
        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000/news`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays read events', async () => {
        const Users = db.collection('users')
        const {insertedId} = await Users.insertOne({
            local: {
                username: 'test'
            },
            reads: [
                {
                    title: 'Test',
                }
            ],
            goals: [
                {
                    title: 'TestGoal',
                },
            ],
        })
        const Events = db.collection('events')
        const date = new Date('2017-08-24T06:52:59.645Z')
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'created-read',
            date,
            title: 'Test',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'reading-read',
            date,
            title: 'Test',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'read-read',
            date,
            title: 'Test',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'created-goal',
            date,
            title: 'TestGoal',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'doing-goal',
            date,
            title: 'TestGoal',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'done-goal',
            date,
            title: 'TestGoal',
        })
        await Events.insertOne({
            userId: ObjectID(insertedId),
            type: 'done-goal',
            date,
            title: 'DeletedGoal',
        })
        const browserPage = await browser.createPage()
        const status = await browserPage.open(`http://localhost:3000/news`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays journal events', async () => {
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

        const status = await browserPage.open(`http://localhost:3000/news`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays changes to user data', async () => {
        const browserPage = await browser.createPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)

        const status = await browserPage.open(`http://localhost:3000/news`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('limits results', async () => {
        const browserPage = await browser.createPage()
        
        await generateAndLogUser(browserPage)
        for (let i=0; i<11; i++) {
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
        }

        const status = await browserPage.open(`http://localhost:3000/news`)
        expect(status).toBe('success')

        const text = await browserPage.property('content')
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()                
    })
})

