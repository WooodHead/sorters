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


afterAll(async () => {
    await teardown({db, browser})
})

describe('news', () => {
    afterEach(async () => {
        await db.dropDatabase()    
    })

    it('displays', async () => {
        const browserPage = await browser.newPage()
        const response = await browserPage.goto(`http://localhost:3000/`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays read events', async () => {
        const Users = db.collection('users')
        const Reads = db.collection('reads')
        const Goals = db.collection('goals')
        const {insertedId: userId} = await Users.insertOne({
            local: {
                username: 'test'
            },
        });
        const {insertedId: goalId} = await Goals.insertOne({
            userId,
            title: 'Test',
        })
        const {insertedId: readId} = await Reads.insertOne({
            userId,
            title: 'TestGoal',
        })
        await Users.update({}, {
            $set: {
                readIds: [readId],
                goalIds: [goalId],
            },
        })
        const Events = db.collection('events')
        const date = new Date('2017-08-24T06:52:59.645Z')
        await Events.insertOne({
            userId,
            type: 'created-read',
            date,
            readId,
        })
        await Events.insertOne({
            userId,
            type: 'reading-read',
            date,
            readId,
        })
        await Events.insertOne({
            userId,
            type: 'read-read',
            date,
            readId,
        })
        await Events.insertOne({
            userId,
            type: 'created-goal',
            date,
            goalId,
        })
        await Events.insertOne({
            userId,
            type: 'doing-goal',
            date,
            goalId,
        })
        await Events.insertOne({
            userId,
            type: 'done-goal',
            date,
            goalId,
        })
        await Events.insertOne({
            userId,
            type: 'done-goal',
            date,
            goalId,
        })
        const browserPage = await browser.newPage()
        const response = await browserPage.goto(`http://localhost:3000/`)
        expect(response.status()).toBe(200)
        
        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays journal events', async () => {
        const browserPage = await browser.newPage()

        await generateAndLogUser(browserPage)
        
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

        
        const response = await browserPage.goto(`http://localhost:3000/`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('displays changes to user data', async () => {
        const browserPage = await browser.newPage()

        await generateAndLogUser(browserPage)
        await setUserData(browserPage)

        const response = await browserPage.goto(`http://localhost:3000/`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()
    })

    it('limits results', async () => {
        const browserPage = await browser.newPage()
        
        await generateAndLogUser(browserPage)
        const goalIds = await getGoalIds(browserPage)

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
                        goalIds,
                    },
                },
            })    
        }

        const response = await browserPage.goto(`http://localhost:3000/`)
        expect(response.status()).toBe(200)

        const text = await response.text()
        const $ = cheerio.load(text)
        const page = $('#__next')
        const html = pretty(page.html())
        expect(html).toMatchSnapshot()                
    })
})

