const {ObjectId} = require('mongodb')
const {findOne, find} = require('./utils')

const MIGRATIONS = [
    async (db) => {
        async function doStuff(userId, type, read, Collection, newType) {
            let date = new Date('2017-08-01')
            const event = await findOne(Events, {
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
                userId,
                title: read.title,
                url: read.articleUrl,
                createdAt: date,
                updatedAt: date,
                topicTitles: [],
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
        const users = await find(Users, {})
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
        try {
            console.info('Remove outdated events.')
            console.info((await Events.remove({type: 'wrote-about-read'})).result)
            console.info((await Events.remove({type: 'spoke-about-read'})).result)
        } catch (e) {
            console.error(e)
        }
    },
    async (db) => {
        async function doStuff(userId, entities, type, updateEvents, Collection) {
            if (!entities) {
                return
            }
            const insertedIds = []
            for (const entity of entities) {
                console.info(`Processing ${entity.title}`)
                entity.userId = userId
                let createdAt = new Date('2017-08-01')
                let updatedAt = new Date('2017-08-01')
                let event = await findOne(Events, {
                    type: `created-${type}`,
                    title: entity.title,
                    userId,
                }, {
                    sort: {
                        date: -1
                    }
                })
                if (event) {
                    createdAt = event.date
                    updatedAt = event.date
                }

                if (updateEvents) {
                    event = await findOne(Events, {
                        type: {
                            $in: updateEvents.map(e => `${e}-${type}`),
                        },
                        title: entity.title,
                        userId,
                    }, {
                        sort: {
                            date: -1
                        }
                    })
                    if (event) {
                        updatedAt = event.date
                    }
                }

                entity.createdAt = createdAt
                entity.updatedAt = updatedAt
                
                console.info(`Inserting ${type}`, entity)
                const {insertedId} = await Collection.insertOne(entity)
                insertedIds.push(insertedId.toString())

                console.info('Updating events')
                const query = {
                    type: {
                        $in: [`created-${type}`, ...(updateEvents && updateEvents.map(e => `${e}-${type}`) || [])]
                    },
                    title: entity.title,
                    userId,
                }
                await Events.updateMany({
                    type: {
                        $in: [`created-${type}`, ...(updateEvents && updateEvents.map(e => `${e}-${type}`) || [])]
                    },
                    title: entity.title,
                    userId,
                }, {
                    $set: {
                        [`${type}Id`]: insertedId.toString(),
                    },
                    $unset: {
                        title: '',
                    },
                })
            }
            await Users.update({
                _id: ObjectId(userId),
            }, {
                $set: {
                    [`${type}Ids`]: insertedIds,
                },
                $unset: {
                    [`${type}s`]: '',
                },
            })
        }
        async function doStuff2(Collection, types, COLLECTIONS_BY_TYPE) {
            const entities = await find(Collection, {})
            for (const entity of entities) {
                console.info(entity)
                const update = {
                    $set: {},
                    $unset: {},
                }
                console.info(`Processing ${entity.title}`)
                for (const {type, Collection} of types) {
                    console.info(`in particular ${type}`)
                    const titles = entity[`${type}Titles`]
                    const ids = []
                    for (const title of titles) {
                        console.info(`Processing title ${title}`)
                        const otherEntity = await findOne(COLLECTIONS_BY_TYPE[type], {
                            title,
                            userId: entity.userId,
                        })
                        ids.push(otherEntity._id)
                    }
                    console.info(`Ids are ${ids}`)
                    update.$set[`${type}Ids`] = ids
                    update.$unset[`${type}Titles`] = ''
                }
                console.info('Updating', update)
                await Collection.update({
                    _id: ObjectId(entity._id)
                }, update)
            }
        }

        const Users = db.collection('users')
        const Events = db.collection('events')
        const Reads = db.collection('reads')
        const Goals = db.collection('goals')
        const Topics = db.collection('topics')
        const Entries = db.collection('entries')
        const Essays = db.collection('essays')
        const Speeches = db.collection('speeches')
        const Conversations = db.collection('conversations')

        const COLLECTIONS_BY_TYPE = {
            user: Users,
            event: Events,
            read: Reads,
            goal: Goals,
            topic: Topics,
            entry: Entries,
            essay: Essays,
            speech: Speeches,
            conversation: Conversations,
        }

        const users = await find(Users, {})
        for (const user of users) {
            console.info(`Processing user ${user._id}`)
            console.info('Processing user reads')
            await doStuff(user._id, user.reads, 'read', ['reading', 'read'], Reads)
            console.info('Processing user goals')
            await doStuff(user._id, user.goals, 'goal', ['doing', 'done'], Goals)
            console.info('Processing user topics')
            await doStuff(user._id, user.topics, 'topic', null, Topics)
        }

        console.info('Deleting corrupted events')
        console.info(JSON.stringify(await find(Events, {title: {$exists: true}}, {sort:{date: -1}}), null, 2))
        await Events.deleteMany({title: { $exists: true }})
        
        console.info('Processing entries')
        await doStuff2(Entries, [
            {type: 'goal', Collection: Goals},
        ], COLLECTIONS_BY_TYPE)
        console.info('Processing essays')
        await doStuff2(Essays, [
            {type: 'topic', Collection: Topics},
            {type: 'read', Collection: Reads},
        ], COLLECTIONS_BY_TYPE)
        console.info('Processing speeches')
        await doStuff2(Speeches, [
            {type: 'topic', Collection: Topics},
            {type: 'read', Collection: Reads},            
        ], COLLECTIONS_BY_TYPE)
        console.info('Processing conversations')
        await doStuff2(Conversations, [
            {type: 'topic', Collection: Topics},
            {type: 'read', Collection: Reads},            
            {type: 'goal', Collection: Goals},            
        ], COLLECTIONS_BY_TYPE)        
    }
]

async function performMigrations(db) {
    console.info(`Performing migrations...`)

    const Migrations = db.collection('migrations')
    let migrations = await findOne(Migrations, {name: 'migrations'})
    if (!migrations) {
        await Migrations.insert({
            name: 'migrations',
            version: 0,
        })
        migrations = await findOne(Migrations, {name: 'migrations'})
    }
    let version = migrations.version

    console.info(`Current migration version: ${version}`)

    while (version < MIGRATIONS.length) {
        console.info(`Migrating from version ${version} to version ${version + 1}...`)
        await MIGRATIONS[version](db)
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
