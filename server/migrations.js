const {ObjectId} = require('mongodb')

const MIGRATIONS = [
    async (db) => {
        async function doStuff(userId, type, read, Collection, newType) {
            let date = new Date('2017-08-01')
            const event = await Events.findOne({
                type,
                userId,
                title: read.title,
            }, {
                sort: {
                    date: -1
                }
            })
            if (event) {
                date = event.date
            }
            const essay = {
                title: read.title,
                url: read.articleUrl,
                createdAt: date,
                readTitles: [read.title],
            }
            console.info(`Creating ${newType}`, essay)
            const {insertedId} = await Collection.insertOne(essay)
            if (event) {
                console.info('Removing event', event)
                await Events.deleteOne({
                    _id: ObjectId(event._id)
                })
            }
            const newEvent = {
                userId,
                type: `created-${newType}`,
                date,
                [`${newType}Id`]: insertedId,
            }
            console.info('Creating event', newEvent)
            await Events.insertOne(newEvent)
        }
        

        const Users = db.collection('users')
        const Events = db.collection('events')
        const Essays = db.collection('essays')
        const Speeches = db.collection('speeches')
        const users = await Users.find({}).toArray()
        for (const user of users) {
            const userId = user._id
            if (user.reads) {
                for (const read of user.reads) {
                    if (read.articleUrl) {
                        await doStuff(userId, 'wrote-about-read', read, Essays, 'essay')
                    }
                    if (read.videoUrl) {
                        await doStuff(userId, 'spoke-about-read', read, Speeches, 'speech')
                    }
                }
            }
        }
        console.info((await Events.remove({type: 'wrote-about-read'})).result)
        console.info((await Events.remove({type: 'spoke-about-read'})).result)
    }
]

async function performMigrations(db) {
    console.info(`Performing migrations...`)

    const Migrations = db.collection('migrations')
    let migrations = await Migrations.findOne({name: 'migrations'})
    if (!migrations) {
        await Migrations.insert({
            name: 'migrations',
            version: 0,
        })
        migrations = await Migrations.findOne({name: 'migrations'})
    }
    let version = migrations.version

    console.info(`Current migration version: ${version}`)

    while (version < MIGRATIONS.length) {
        console.info(`Migrating from version ${version} to version ${version + 1}...`)
        await MIGRATIONS[0](db)
        version++
        await Migrations.update({
            name: 'migrations'
        }, {
            $set: {
                version,
            }
        })
    }
    console.info(`Migrations performed successfully. Now at version ${version}`)
}

module.exports = {
    performMigrations,
}
