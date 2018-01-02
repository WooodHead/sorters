const {MongoClient, ObjectId} = require('mongodb')
const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const {graphqlExpress, graphiqlExpress} = require('graphql-server-express')
const {makeExecutableSchema} = require('graphql-tools')
const morgan = require('morgan')
const cors = require('cors')
const nodeify = require('nodeify')
const ooth = require('./ooth')
const crypto = require('crypto-browserify')
const {GraphQLScalarType} = require('graphql')
const {objectMap} = require('../utils/objects')
const {performMigrations} = require('./migrations')
const {prepare} = require('./utils')
const {IGNORED_EVENTS} = require('../models/events')

function set(o, key, value) {
    o[key] = value
    return o
}

function testUser(userId) {
    if (!userId) {
        throw new Error('User not logged in.')
    }
}

function testOwns(entity, userId) {
    if (!entity) {
        throw new Error('Entity does not exist.')
    }
    if (!entity.userId) {
        throw new Error('Entity has no owner.')
    }
    if (!userId) {
        throw new Error('No userId')
    }
    if (entity.userId !== userId) {
        throw new Error('Forbidden.')
    }
}

function nodeifyAsync(asyncFunction) {
    return function(...args) {
        return nodeify(asyncFunction(...args.slice(0, -1)), args[args.length-1])
    }
}

async function findUserEntities(user, Collection) {
    return (await Collection.find({ userId: user._id }, {
        sort: {
            createdAt: -1,
        },
    }).toArray()).map(prepare)
}

async function createEntity(userId, entity, Collection, Events, type) {
    testUser(userId)
    const date = new Date()
    entity.userId = userId
    entity.createdAt = date
    entity.updatedAt = date
    const {insertedId} = await Collection.insertOne(entity)
    await Events.insert({
        userId,
        type: `created-${type}`,
        date,
        [`${type}Id`]: insertedId,
    })
    return prepare(await Collection.findOne(ObjectId(insertedId)))
}

async function updateEntity(userId, entity, Collection, Events, type) {
    testUser(userId)

    const _id = ObjectId(entity._id)
    delete(entity._id)
    const actualEntity = await Collection.findOne({ _id })
    testOwns(actualEntity, userId)

    const date = new Date()
    entity.updatedAt = date
    await Collection.update({ _id }, { $set: entity })
    await Events.insert({
        userId,
        type: `updated-${type}`,
        date,
        [`${type}Id`]: _id,
    })

    return prepare(await Collection.findOne(_id))
}

async function deleteEntity(userId, _id, Collection, Events, type) {
    testUser(userId)

    const date = new Date()

    const actualEntity = await Collection.findOne({ _id: ObjectId(_id) })
    testOwns(actualEntity, userId)

    await Collection.deleteOne({ _id: ObjectId(_id) })
    await Events.insert({
        userId,
        type: `deleted-${type}`,
        date,
        [`${type}Id`]: _id,
    })

    return prepare(actualEntity)
}

async function softDeleteEntity(userId, _id, Collection, Events, type, update = {}) {
    testUser(userId)

    const date = new Date()

    const actualEntity = await Collection.findOne({ _id: ObjectId(_id) })
    testOwns(actualEntity, userId)

    update.updatedAt = date
    update.deleted = true
    await Collection.update({ _id: ObjectId(_id) }, {
        $set: update,
    })
    await Events.insert({
        userId,
        type: `deleted-${type}`,
        date,
        [`${type}Id`]: _id,
    })
    return await prepare(Collection.findOne(ObjectId(_id)))
}

async function findRelatedEntities(value, Collection, field) {
    return (await Collection.find({
        [field]: value,
    }).toArray()).map(prepare)
}

const start = async (app, settings) => {
    const client = await MongoClient.connect(settings.mongoUrl)
    const db = client.db(settings.mongoUrl.split('://')[1].split('/')[1])

    await performMigrations(db)

    const Users = db.collection('users')
    const Events = db.collection('events')
    const Entries = db.collection('entries')
    const Essays = db.collection('essays')
    const Speeches = db.collection('speeches')
    const Conversations = db.collection('conversations')
    const Comments = db.collection('comments')

    const COMMENTABLE_COLLECTIONS = {
        entry: Entries,
        essay: Essays,
        speech: Speeches,
        conversation: Conversations,
        comment: Comments,
    }

    Events.createIndex({
        date: -1,
    })
    Entries.createIndex({
        userId: -1,
        date: -1,
    })
    Essays.createIndex({
        userId: -1,
        date: -1,
    })
    Speeches.createIndex({
        userId: -1,
        date: -1,
    })
    Conversations.createIndex({
        userId: -1,
        date: -1,
    })

    const typeDefs = []
    typeDefs.push(`
        scalar Date
        type User {
            _id: ID!
            local: UserLocal
            emailHash: String
            profile: Profile
            reads: [Read]
            goals: [Goal]
            topics: [Topic]
            entries: [Entry]!
            essays: [Essay]!
            speeches: [Speech]!
            conversations: [Conversation]!
            events: [Event]!
        }
        type UserLocal {
            username: String
        }
        type Profile {
            name: String
            about: String
            bio: String
            goals: String
            topics: String
            website: String
            blog: String
            youtube: String
            twitter: String
            reddit: String
            patreon: String
            reading: String
            gender: String
            birthDate: Date
            city: String
            country: String
            selfAuthoringPast: Boolean
            selfAuthoringPresentVirtues: Boolean
            selfAuthoringPresentFaults: Boolean
            selfAuthoringFuture: Boolean
            understandMyself: Boolean
            agreeableness: Int
            compassion: Int
            politeness: Int
            conscientiousness: Int
            industriousness: Int
            orderliness: Int
            extraversion: Int
            enthusiasm: Int
            assertiveness: Int
            neuroticism: Int
            withdrawal: Int
            volatility: Int
            opennessToExperience: Int
            intellect: Int
            openness: Int
        }
        type Read {
            title: String!
            reading: Boolean
            read: Boolean
            essays: [Essay]!
            speeches: [Speech]!
            conversations: [Conversation]!
        }
        type Goal {
            title: String!
            description: String
            doing: Boolean
            done: Boolean
            entries: [Entry]!
            conversations: [Conversation]!
        }
        type Topic {
            title: String!
            description: String
            essays: [Essay]!
            speeches: [Speech]!
            conversations: [Conversation]!
        }
        interface Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
        }
        type Entry implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            url: String
            description: String
            goalTitles: [String]!
            createdAt: Date!
            updatedAt: Date!
            comments: [Comment]!
        }
        type Essay implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
            createdAt: Date!
            updatedAt: Date!
            comments: [Comment]!
        }
        type Speech implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
            createdAt: Date!
            updatedAt: Date!
            comments: [Comment]!
        }
        type Conversation implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
            goalTitles: [String]!
            createdAt: Date!
            updatedAt: Date!
            comments: [Comment]!
        }
        type Comment {
            _id: ID!
            userId: ID!
            user: User!
            entityType: String!
            entityId: ID!
            entity: Entity
            rootEntityId: ID!
            rootEntityType: String!
            rootEntity: Entity
            content: String
            createdAt: Date!
            updatedAt: Date!
            comments: [Comment]!
            deleted: Boolean
        }

        interface Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
        }
        type UpdatedValue implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            name: String
        }
        type UpdatedProfile implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            values: [String]
        }
        type UpdatedRead implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            title: String!
            read: Read
        }
        type UpdatedGoal implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            title: String!
            goal: Goal
        }
        type UpdatedTopic implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            title: String!
            topic: Topic
        }
        type UpdatedEntry implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            entryId: ID!
            entry: Entry
        }
        type UpdatedEssay implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            essayId: ID!
            essay: Essay
        }
        type UpdatedSpeech implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            speechId: ID!
            speech: Speech
        }
        type UpdatedConversation implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            conversationId: ID!
            conversation: Conversation
        }
        type UpdatedComment implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            commentId: ID!
            comment: Comment
        }

        input ProfileInput {
            name: String
            about: String
            bio: String
            website: String
            blog: String
            youtube: String
            twitter: String
            reddit: String
            patreon: String
            gender: String
            birthDate: Date
            city: String
            country: String
            selfAuthoringPast: Boolean
            selfAuthoringPresentVirtues: Boolean
            selfAuthoringPresentFaults: Boolean
            selfAuthoringFuture: Boolean
            understandMyself: Boolean
            agreeableness: Int
            compassion: Int
            politeness: Int
            conscientiousness: Int
            industriousness: Int
            orderliness: Int
            extraversion: Int
            enthusiasm: Int
            assertiveness: Int
            neuroticism: Int
            withdrawal: Int
            volatility: Int
            opennessToExperience: Int
            intellect: Int
            openness: Int
        }
        input ReadInput {
            title: String!
            reading: Boolean
            read: Boolean
        }
        input NewReadInput {
            title: String!
        }
        input GoalInput {
            title: String!
            description: String
            doing: Boolean
            done: Boolean
        }
        input NewGoalInput {
            title: String!
        }
        input TopicInput {
            title: String!
            description: String
        }
        input NewTopicInput {
            title: String!
        }
        input EntryInput {
            _id: ID!
            title: String!
            url: String
            description: String
            goalTitles: [String]!
        }
        input NewEntryInput {
            title: String!
            url: String
            description: String
            goalTitles: [String]!
        }
        input EssayInput {
            _id: ID!
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
        }
        input NewEssayInput {
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
        }
        input SpeechInput {
            _id: ID!
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
        }
        input NewSpeechInput {
            title: String!
            url: String
            content: String
            topicTitles: [String]!
            readTitles: [String]!
        }
        input ConversationInput {
            _id: ID!
            title: String!
            content: String
            topicTitles: [String]!
            readTitles: [String]!
            goalTitles: [String]!
        }
        input NewConversationInput {
            title: String!
            content: String
            topicTitles: [String]!
            readTitles: [String]!
            goalTitles: [String]!
        }
        input CommentInput {
            _id: ID!
            content: String!
        }
        input NewCommentInput {
            entityType: String!
            entityId: String!
            content: String!
        }

        type Query {
            me: User
            user(_id: ID!): User
            userByUsername(username: String!): User
            users: [User!]!
            events(limit: Int): [Event!]!
            entry(_id: ID!): Entry
            essay(_id: ID!): Essay
            speech(_id: ID!): Speech
            conversation(_id: ID!): Conversation
        }
        type Mutation {
            updateProfile(profile: ProfileInput): User

            updateReading(reading: String): User
            createRead(read: NewReadInput!): User
            updateReads(reads: [ReadInput]!): User

            updateGoalsDescription(goals: String): User
            createGoal(goal: NewGoalInput!): User
            updateGoals(goals: [GoalInput]!): User

            updateTopicsDescription(topics: String): User
            createTopic(topic: NewTopicInput!): User
            updateTopics(topics: [TopicInput]!): User

            createEntry(entry: NewEntryInput!): Entry
            updateEntry(entry: EntryInput!): Entry
            deleteEntry(_id: ID!): Entry

            createEssay(essay: NewEssayInput!): Essay
            updateEssay(essay: EssayInput!): Essay
            deleteEssay(_id: ID!): Essay

            createSpeech(speech: NewSpeechInput!): Speech
            updateSpeech(speech: SpeechInput!): Speech
            deleteSpeech(_id: ID!): Speech

            createConversation(conversation: NewConversationInput!): Conversation
            updateConversation(conversation: ConversationInput!): Conversation
            deleteConversation(_id: ID!): Conversation

            createComment(comment: NewCommentInput!): Comment
            updateComment(comment: CommentInput!): Comment
            deleteComment(_id: ID!): Comment
        }

        schema {
            query: Query
            mutation: Mutation
        }
    `);

    const resolvers = {
        Date: new GraphQLScalarType({
            name: 'Date',
            description: 'Date',
            parseValue(value) {
                return new Date(value);
            },
            serialize(value) {
                return value.getTime();
            },
            parseLiteral(ast) {
                if (ast.kind === Kind.INT) {
                    return parseInt(ast.value, 10);
                }
                return null;
            },
        }),
        Query: {
            me: async (root, args, {userId}) => {
                if (!userId) {
                    return null
                }
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            users: async (root, args, context) => {
                return (await Users.find({
                    'local.username': {
                        $exists: true
                    }
                }, {
                    sort: {
                        'local.username': 1
                    }
                }).toArray()).map(prepare)
            },
            userByUsername: async (root, {username}, {userId}) => {
                return prepare(await Users.findOne({
                    'local.username': username
                }))
            },
            events: async (root, {limit}, context) => {
                return (await Events.find({
                    type: {
                        $nin: IGNORED_EVENTS,
                    }
                }, {
                    sort: {
                        date: -1
                    },
                    limit: limit || 400,
                }).toArray()).map(prepare)
            },
            entry: async (root, {_id}) => {
                return prepare(await Entries.findOne(ObjectId(_id)))
            },
            essay: async (root, {_id}) => {
                return prepare(await Essays.findOne(ObjectId(_id)))
            },
            speech: async (root, {_id}) => {
                return prepare(await Speeches.findOne(ObjectId(_id)))
            },
            conversation: async (root, {_id}) => {
                return prepare(await Conversations.findOne(ObjectId(_id)))
            },
        },
        User: {
            emailHash: async (user) => {
                if (user.local && user.local.email) {
                    const email = user.local.email
                    return crypto.createHash('md5').update(email).digest("hex")
                }
            },
            entries: async (user) => {
                return await findUserEntities(user, Entries)
            },
            essays: async (user) => {
                return await findUserEntities(user, Essays)
            },
            speeches: async (user) => {
                return await findUserEntities(user, Speeches)
            },
            conversations: async (user) => {
                return await findUserEntities(user, Conversations)
            },
            events: async (user, params, context) => {
                return (await Events.find({
                    userId: user._id,
                }, {
                    sort: {
                        date: -1
                    },
                    limit: 600,
                }).toArray()).map(prepare)
            },
        },
        Read: {
            essays: async (read) => {
                return await findRelatedEntities(read.title, Essays, 'readTitles')
            },
            speeches: async (read) => {
                return await findRelatedEntities(read.title, Speeches, 'readTitles')
            },
            conversations: async (read) => {
                return await findRelatedEntities(read.title, Conversations, 'readTitles')
            },
        },
        Goal: {
            entries: async (goal) => {
                return await findRelatedEntities(goal.title, Entries, 'goalTitles')
            },
            conversations: async (goal) => {
                return await findRelatedEntities(goal.title, Conversations, 'goalTitles')
            }
        },
        Entity: {
            __resolveType({type}) {
                const ENTITY_TYPES = {
                    'entry': 'Entry',
                    'essay': 'Essay',
                    'speech': 'Speech',
                    'conversation': 'Conversation',
                }
                if (!ENTITY_TYPES[type]) {
                    throw new Error(`Unknown entity type ${type}.`)
                }
                return ENTITY_TYPES[type]
            },
        },
        Topic: {
            essays: async (topic) => {
                return await findRelatedEntities(topic.title, Essays, 'topicTitles')
            },
            speeches: async (topic) => {
                return await findRelatedEntities(topic.title, Speeches, 'topicTitles')
            },
            conversations: async (topic) => {
                return await findRelatedEntities(topic.title, Conversations, 'topicTitles')
            },
        },
        Entry: {
            type() {
                return 'entry'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return (await Comments.find({
                    entityType: 'entry',
                    entityId: _id
                }, {
                    sort: {
                        createdAt: -1,
                    },
                }).toArray()).map(prepare)
            },
        },
        Essay: {
            type() {
                return 'essay'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return (await Comments.find({
                    entityType: 'essay',
                    entityId: _id
                }, {
                    sort: {
                        createdAt: -1,
                    },
                }).toArray()).map(prepare)
            },
        },
        Speech: {
            type() {
                return 'speech'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return (await Comments.find({
                    entityType: 'speech',
                    entityId: _id
                }, {
                    sort: {
                        createdAt: -1,
                    },
                }).toArray()).map(prepare)
            },
        },
        Conversation: {
            type() {
                return 'conversation'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return (await Comments.find({
                    entityType: 'conversation',
                    entityId: _id
                }, {
                    sort: {
                        createdAt: -1,
                    },
                }).toArray()).map(prepare)
            },
        },
        Comment: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return (await Comments.find({
                    entityType: 'comment',
                    entityId: _id
                }, {
                    sort: {
                        createdAt: -1,
                    },
                }).toArray()).map(prepare)
            },
            entity: async ({entityType, entityId}) => {
                const Collection = COMMENTABLE_COLLECTIONS[entityType]
                const entity = await Collection.findOne(ObjectId(entityId))
                if (entity) {
                    return set(entity, 'type', entityType)
                }
            },
            rootEntity: async ({rootEntityType, rootEntityId}) => {
                const Collection = COMMENTABLE_COLLECTIONS[rootEntityType]
                const entity = await Collection.findOne(ObjectId(rootEntityId))
                if (entity) {
                    return set(entity, 'type', rootEntityType)
                }
            },
        },
        Event: {
            __resolveType({type}, context, info) {
                const eventType = {
                    'updated-profile': 'UpdatedProfile',
                    'updated-reading': 'UpdatedValue',
                    'updated-goals': 'UpdatedValue',
                    'updated-topics': 'UpdatedValue',
                    'completed-program': 'UpdatedValue',
                    'created-read': 'UpdatedRead',
                    'reading-read': 'UpdatedRead',
                    'read-read': 'UpdatedRead',
                    'created-goal': 'UpdatedGoal',
                    'doing-goal': 'UpdatedGoal',
                    'done-goal': 'UpdatedGoal',
                    'created-topic': 'UpdatedTopic',
                    'created-entry': 'UpdatedEntry',
                    'updated-entry': 'UpdatedEntry',
                    'deleted-entry': 'UpdatedEntry',
                    'created-essay': 'UpdatedEssay',
                    'updated-essay': 'UpdatedEssay',
                    'deleted-essay': 'UpdatedEssay',
                    'created-speech': 'UpdatedSpeech',
                    'updated-speech': 'UpdatedSpeech',
                    'deleted-speech': 'UpdatedSpeech',
                    'created-conversation': 'UpdatedConversation',
                    'updated-conversation': 'UpdatedConversation',
                    'deleted-conversation': 'UpdatedConversation',
                    'created-comment': 'UpdatedComment',
                    'updated-comment': 'UpdatedComment',
                    'deleted-comment': 'UpdatedComment',
                }[type]
                if (!eventType) {
                    throw new Error(`Unknown event type: ${type}`)
                }
                return eventType
            },
        },
        UpdatedValue: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
        },
        UpdatedProfile: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
        },
        UpdatedRead: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            read: async ({userId, title}) => {
                const user = await Users.findOne(ObjectId(userId))
                if (user.reads) {
                    return user.reads.find(r => r.title === title)
                }
            },
        },
        UpdatedGoal: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            goal: async ({userId, title}) => {
                const user = await Users.findOne(ObjectId(userId))
                if (user.goals) {
                    return user.goals.find(r => r.title === title)
                }
            },
        },
        UpdatedTopic: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            topic: async ({userId, title}) => {
                const user = await Users.findOne(ObjectId(userId))
                if (user.topics) {
                    return user.topics.find(r => r.title === title)
                }
            },
        },
        UpdatedEntry: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            entry: async ({entryId}) => {
                return prepare(await Entries.findOne(ObjectId(entryId)))
            },
        },
        UpdatedEssay: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            essay: async ({essayId}) => {
                return prepare(await Essays.findOne(ObjectId(essayId)))
            },
        },
        UpdatedSpeech: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            speech: async ({speechId}) => {
                return prepare(await Speeches.findOne(ObjectId(speechId)))
            },
        },
        UpdatedConversation: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            conversation: async ({conversationId}) => {
                return prepare(await Conversations.findOne(ObjectId(conversationId)))
            },
        },
        UpdatedComment: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comment: async ({commentId}) => {
                return prepare(await Comments.findOne(ObjectId(commentId)))
            },
        },
        Mutation: {
            updateProfile: async (root, {profile}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: objectMap(profile, key => `profile.${key}`),
                });

                const oldProfile = user.profile || {}
                const updated = Object.keys(profile).filter(key => !(
                    profile[key] === oldProfile[key]
                    || profile[key] instanceof Date && oldProfile[key] instanceof Date && profile[key].getTime() === oldProfile[key].getTime()
                ))
                const date = new Date() 
                await Events.insert({
                    userId,
                    type: 'updated-profile',
                    values: updated,
                    date,
                })
                for (const name of updated) {
                    if ([
                        'selfAuthoringPast',
                        'selfAuthoringPresentVirtues',
                        'selfAuthoringPresentFaults',
                        'selfAuthoringFuture',
                        'understandMyself',
                    ].indexOf(name) > -1 && profile[name]) {
                        await Events.insert({
                            userId,
                            type: `completed-program`,
                            name,
                            date,
                        })
                    }
                }
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateReading: async (root, {reading}, {userId}, info) => {
                testUser(userId)
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        'profile.reading': reading
                    }
                });
                await Events.insert({
                    userId,
                    type: 'updated-reading',
                    date: new Date(),
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateReads: async (root, {reads}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                const userReads = user.reads || []
                for (const read of reads) {
                    const title = read.title
                    const oldRead = userReads.find(r => r.title === read.title)
                    if (!oldRead) {
                        await Events.insert({
                            userId,
                            type: 'created-read',
                            title,
                            date: new Date(),
                        })
                    } else {
                        if (!oldRead.reading && read.reading) {
                            await Events.insert({
                                userId,
                                type: 'reading-read',
                                title,
                                date: new Date(),
                            })
                        }
                        if (!oldRead.read && read.read) {
                            await Events.insert({
                                userId,
                                type: 'read-read',
                                title,
                                date: new Date(),
                            })
                        }
                    }
                }
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        reads
                    }
                });
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            createRead: async (root, {read}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                if (user.reads) {
                    if (user.reads.some(r => r.title === read.title)) {
                        throw new Error('You already created this read.')
                    }
                }
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $push: {
                        reads: read
                    }
                })
                await Events.insert({
                    userId,
                    type: 'created-read',
                    date: new Date(),
                    title: read.title,
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateGoalsDescription: async (root, {goals}, {userId}, info) => {
                testUser(userId)
                await (Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        'profile.goals': goals
                    }
                }));
                await Events.insert({
                    userId,
                    type: 'updated-goals',
                    date: new Date(),
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateGoals: async (root, {goals}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                const userGoals = user.goals || []
                for (const goal of goals) {
                    const title = goal.title
                    const oldGoal = userGoals.find(g => g.title === goal.title)
                    if (!oldGoal) {
                        await Events.insert({
                            userId,
                            type: 'created-goal',
                            title,
                            date: new Date(),
                        })
                    } else {
                        if (!oldGoal.doing && goal.doing) {
                            await Events.insert({
                                userId,
                                type: 'doing-goal',
                                title,
                                date: new Date(),
                            })
                        }
                        if (!oldGoal.done && goal.done) {
                            await Events.insert({
                                userId,
                                type: 'done-goal',
                                title,
                                date: new Date(),
                            })
                        }
                    }
                }                
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        goals
                    }
                });
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            createGoal: async (root, {goal}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                if (user.goals) {
                    if (user.goals.some(g => g.title === goal.title)) {
                        throw new Error('You already created this goal.')
                    }
                }
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $push: {
                        goals: goal
                    }
                })
                await Events.insert({
                    userId,
                    type: 'created-goal',
                    date: new Date(),
                    title: goal.title,
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateTopicsDescription: async (root, {topics}, {userId}, info) => {
                testUser(userId)
                await (Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        'profile.topics': topics
                    }
                }));
                await Events.insert({
                    userId,
                    type: 'updated-topics',
                    date: new Date(),
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            updateTopics: async (root, {topics}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                const userTopics = user.topics || []
                for (const topic of topics) {
                    const title = topic.title
                    const oldTopic = userTopics.find(t => t.title === topic.title)
                    if (!oldTopic) {
                        await Events.insert({
                            userId,
                            type: 'created-topic',
                            title,
                            date: new Date(),
                        })
                    }
                }                
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $set: {
                        topics
                    }
                });
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            createTopic: async (root, {topic}, {userId}, info) => {
                testUser(userId)
                const user = await Users.findOne(ObjectId(userId))
                if (user.topics) {
                    if (user.topics.some(t => t.title === topic.title)) {
                        throw new Error('You already created this topic.')
                    }
                }
                await Users.update({
                    _id: ObjectId(userId)
                }, {
                    $push: {
                        topics: topic
                    }
                })
                await Events.insert({
                    userId,
                    type: 'created-topic',
                    date: new Date(),
                    title: topic.title,
                })
                return prepare(await Users.findOne(ObjectId(userId)));
            },
            createEntry: async (root, {entry}, {userId}, info) => {
                return await createEntity(userId, entry, Entries, Events, 'entry')
            },
            updateEntry: async (root, {entry}, {userId}, info) => {
                return await updateEntity(userId, entry, Entries, Events, 'entry')
            },
            deleteEntry: async (root, {_id}, {userId}, info) => {
                return await deleteEntity(userId, _id, Entries, Events, 'entry')
            },
            createEssay: async (root, {essay}, {userId}, info) => {
                return await createEntity(userId, essay, Essays, Events, 'essay')
            },
            updateEssay: async (root, {essay}, {userId}, info) => {
                return await updateEntity(userId, essay, Essays, Events, 'essay')
            },
            deleteEssay: async (root, {_id}, {userId}, info) => {
                return await deleteEntity(userId, _id, Essays, Events, 'entry')
            },
            createSpeech: async (root, {speech}, {userId}, info) => {
                return await createEntity(userId, speech, Speeches, Events, 'speech')
            },
            updateSpeech: async (root, {speech}, {userId}, info) => {
                return await updateEntity(userId, speech, Speeches, Events, 'speech')
            },
            deleteSpeech: async (root, {_id}, {userId}, info) => {
                return await deleteEntity(userId, _id, Speeches, Events, 'speech')
            },
            createConversation: async (root, {conversation}, {userId}, info) => {
                return await createEntity(userId, conversation, Conversations, Events, 'conversation')
            },
            updateConversation: async (root, {conversation}, {userId}, info) => {
                return await updateEntity(userId, conversation, Conversations, Events, 'conversation')
            },
            deleteConversation: async (root, {_id}, {userId}, info) => {
                return await deleteEntity(userId, _id, Conversations, Events, 'conversation')
            },
            createComment: async (root, {comment}, {userId}, info) => {
                testUser(userId)
                const Collection = COMMENTABLE_COLLECTIONS[comment.entityType]
                if (!Collection) {
                    throw new Error(`Invalid entity type ${comment.entityType}`)
                }
                const entity = await Collection.findOne(ObjectId(comment.entityId))
                if (!entity) {
                    throw new Error(`Entity with ID ${comment.entityId} does not exist.`)
                }
                if (comment.entityType === 'comment') {
                    comment.rootEntityType = entity.rootEntityType
                    comment.rootEntityId = entity.rootEntityId
                } else {
                    comment.rootEntityType = comment.entityType
                    comment.rootEntityId = comment.entityId
                }
                const date = new Date()
                comment.userId = userId
                comment.createdAt = date
                comment.updatedAt = date
                const {insertedId} = await Comments.insertOne(comment)
                await Events.insert({
                    userId,
                    type: 'created-comment',
                    date,
                    commentId: insertedId,
                })
                return await Comments.findOne(ObjectId(insertedId))
            },
            updateComment: async (root, {comment}, {userId}, info) => {
                return await updateEntity(userId,comment, Comments, Events, 'comment')
            },
            deleteComment: async (root, {_id}, {userId}, info) => {
                return await softDeleteEntity(userId, _id, Comments, Events, 'comment', { content: null })
            }
        },
    }

    const schema = makeExecutableSchema({
        typeDefs,
        resolvers
    })

    app.use(morgan('dev'))

    const corsMiddleware = cors({
        origin: settings.originUrl,
        credentials: true,
        preflightContinue: false
    })
    app.use(corsMiddleware)
    app.options(corsMiddleware)

    app.use(session({
        name: 'api-session-id',
        secret: settings.sessionSecret,
        resave: false,
        saveUninitialized: true,
    }))
    await ooth(app, db, settings)

    app.use('/graphql', bodyParser.json(), graphqlExpress((req, res) => {
        return {
            schema,
            context: { userId: req.user && req.user._id }
        }
    }))

    app.use('/graphiql', graphiqlExpress({
        endpointURL: '/graphql',
    }))
}

module.exports = {
    start
}