import {MongoClient, ObjectID} from 'mongodb'
import {spawn} from 'child_process'
import phantom from 'phantom'

export const setup = async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000
    const client = await MongoClient.connect('mongodb://localhost:27017/sorters_test')
    const db = client.db('sorters_test')
    await db.dropDatabase()
    
    const browser = await phantom.create([], { logLevel: 'error' })
    
    return {db, browser}
}

export const teardown = async ({db, browser}) => {
    await db.close()

    await browser.exit()
}