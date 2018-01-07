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
const {prepare, find} = require('./utils')
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

async function findUserEntities(user, Collection, sort = { createdAt: -1 }) {
    return await findRelatedEntities(user._id, Collection, 'userId', sort)
}

async function findRelatedEntities(value, Collection, field, sort = { createdAt: -1 }) {
    const res = await find(Collection, {
        [field]: value,
    }, {
        sort
    })
    return res;
}

async function findByIds(Collection, ids) {
    if (!ids) {
        return []
    }
    return await find(Collection, {
        _id: {
            $in: ids.map(ObjectId),
        },
    })
}

async function findComments(Comments, entityType, entityId) {
    return await find(Comments, {
        entityType,
        entityId,
    }, {
        sort: {
            createdAt: -1,
        },
    })
}

async function updateOrderedEntities(userId, entityIds, Collection, type, Users) {
    testUser(userId)
    await Users.update({
        _id: ObjectId(userId)
    }, {
        $set: {
            [`${type}Ids`]: entityIds,
        },
    })
    return await findByIds(Collection, entityIds)
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

async function createOrderedEntity(userId, entity, Collection, Events, type, Users) {
    const newEntity = await createEntity(userId, entity, Collection, Events, type, Users)
    await Users.update({
        _id: ObjectId(userId)
    }, {
        $push: {
            [`${type}Ids`]: newEntity._id,
        },
    })
    return newEntity
}

async function updateEntity(userId, entity, Collection, Events, type, updateEvents) {
    testUser(userId)

    const _id = ObjectId(entity._id)
    delete(entity._id)
    const actualEntity = await Collection.findOne({ _id })
    testOwns(actualEntity, userId)

    const date = new Date()
    entity.updatedAt = date
    await Collection.update({ _id }, { $set: entity })
    if (updateEvents) {
        await updateEvents(actualEntity)
    } else {
        await Events.insert({
            userId,
            type: `updated-${type}`,
            date,
            [`${type}Id`]: _id,
        })
    }

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

async function deleteOrderedEntity(userId, _id, Collection, Events, type, Users) {
    await deleteEntity(userId, _id, Collection, Events, type)
    await Users.update({
        _id: ObjectId(userId)
    }, {
        $pull: {
            [`${type}Ids`]: _id,
        },
    })
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

const start = async (app, settings) => {
    const client = await MongoClient.connect(settings.mongoUrl)
    const db = client.db(settings.mongoUrl.split('://')[1].split('/')[1])

    await performMigrations(db)

    const Users = db.collection('users')
    const Events = db.collection('events')
    const Reads = db.collection('reads')
    const Goals = db.collection('goals')
    const Topics = db.collection('topics')
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
            readIds: [ID]
            reads: [Read]!
            goalIds: [ID]
            goals: [Goal]!
            topicIds: [ID]
            topics: [Topic]!
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
        interface Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
        }
        type Read implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            reading: Boolean
            read: Boolean
            essays: [Essay]!
            speeches: [Speech]!
            conversations: [Conversation]!
            comments: [Comment]!
        }
        type Goal implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            description: String
            doing: Boolean
            done: Boolean
            entries: [Entry]!
            conversations: [Conversation]!
            comments: [Comment]!
        }
        type Topic implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            description: String
            essays: [Essay]!
            speeches: [Speech]!
            conversations: [Conversation]!
            comments: [Comment]!
        }
        type Entry implements Entity {
            type: String!
            _id: ID!
            userId: ID!
            user: User!
            title: String!
            url: String
            description: String
            goalIds: [ID]!
            goals: [Goal]!
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
            topicIds: [ID]!
            topics: [Topic]!
            readIds: [ID]!
            reads: [Read]!
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
            topicIds: [ID]!
            topics: [Topic]!
            readIds: [ID]!
            reads: [Read]!
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
            topicIds: [ID]!
            topics: [Topic]!
            readIds: [ID]!
            reads: [Read]!
            goalIds: [ID]!
            goals: [Goal]!
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
            readId: ID!
            read: Read
        }
        type UpdatedGoal implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            goalId: ID!
            goal: Goal
        }
        type UpdatedTopic implements Event {
            _id: ID!
            userId: ID!
            user: User!
            type: String!
            date: Date!
            topicId: ID!
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
            _id: String!
            title: String!
            reading: Boolean
            read: Boolean
        }
        input NewReadInput {
            title: String!
        }
        input GoalInput {
            _id: ID!
            title: String!
            description: String
            doing: Boolean
            done: Boolean
        }
        input NewGoalInput {
            title: String!
        }
        input TopicInput {
            _id: ID!
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
            goalIds: [ID]!
        }
        input NewEntryInput {
            title: String!
            url: String
            description: String
            goalIds: [ID]!
        }
        input EssayInput {
            _id: ID!
            title: String!
            url: String
            content: String
            topicIds: [ID]!
            readIds: [ID]!
        }
        input NewEssayInput {
            title: String!
            url: String
            content: String
            topicIds: [ID]!
            readIds: [ID]!
        }
        input SpeechInput {
            _id: ID!
            title: String!
            url: String
            content: String
            topicIds: [ID]!
            readIds: [ID]!
        }
        input NewSpeechInput {
            title: String!
            url: String
            content: String
            topicIds: [ID]!
            readIds: [ID]!
        }
        input ConversationInput {
            _id: ID!
            title: String!
            content: String
            topicIds: [ID]!
            readIds: [ID]!
            goalIds: [ID]!
        }
        input NewConversationInput {
            title: String!
            content: String
            topicIds: [ID]!
            readIds: [ID]!
            goalIds: [ID]!
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
            readIds: [ID]
            read(_id: ID!): Read
            goalIds: [ID]
            goal(_id: ID!): Goal
            topicIds: [ID]
            topic(_id: ID!): Topic
            entry(_id: ID!): Entry
            essay(_id: ID!): Essay
            speech(_id: ID!): Speech
            conversation(_id: ID!): Conversation
        }
        type Mutation {
            updateProfile(profile: ProfileInput): User

            updateReading(reading: String): User
            updateReads(readIds: [ID]!): [Read]!
            createRead(read: NewReadInput!): Read
            updateRead(read: ReadInput!): Read
            deleteRead(_id: ID!): Read

            updateGoalsDescription(goals: String): User
            updateGoals(goalIds: [ID]!): [Goal]!
            createGoal(goal: NewGoalInput!): Goal
            updateGoal(goal: GoalInput!): Goal
            deleteGoal(_id: ID!): Goal

            updateTopicsDescription(topics: String): User
            updateTopics(topicIds: [ID]!): [Topic]!
            createTopic(topic: NewTopicInput!): Topic
            updateTopic(topic: TopicInput!): Topic
            deleteTopic(_id: ID!): Topic

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
                return find(Users, {
                    'local.username': {
                        $exists: true
                    }
                }, {
                    sort: {
                        'local.username': 1
                    }
                })
            },
            userByUsername: async (root, {username}, {userId}) => {
                return prepare(await Users.findOne({
                    'local.username': username
                }))
            },
            events: async (root, {limit}, context) => {
                const events = await find(Events, {
                    type: {
                        $nin: IGNORED_EVENTS,
                    }
                }, {
                    sort: {
                        date: -1
                    },
                    limit: limit || 400,
                })
                return events
            },
            read: async (root, {_id}) => {
                return prepare(await Reads.findOne(ObjectId(_id)))
            },
            goal: async (root, {_id}) => {
                return prepare(await Goals.findOne(ObjectId(_id)))
            },
            topic: async (root, {_id}) => {
                return prepare(await Topics.findOne(ObjectId(_id)))
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
            reads: async ({readIds}) => {
                return await findByIds(Reads, readIds)
            },
            goals: async ({goalIds}) => {
                return await findByIds(Goals, goalIds)
            },
            topics: async ({topicIds}) => {
                return await findByIds(Topics, topicIds)
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
                return await find(Events, {
                    userId: user._id,
                }, {
                    sort: {
                        date: -1
                    },
                    limit: 600,
                })
            },
        },
        Entity: {
            __resolveType({type}) {
                const ENTITY_TYPES = {
                    'read': 'Read',
                    'topic': 'Topic',
                    'goal': 'Goal',
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
        Read: {
            type() {
                return 'read'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            essays: async (read) => {
                return await findRelatedEntities(read._id, Essays, 'readIds')
            },
            speeches: async (read) => {
                return await findRelatedEntities(read._id, Speeches, 'readIds')
            },
            conversations: async (read) => {
                return await findRelatedEntities(read._id, Conversations, 'readIds')
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'read', _id)
            },
        },
        Goal: {
            type() {
                return 'goal'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            entries: async (goal) => {
                return await findRelatedEntities(goal._id, Entries, 'goalIds')
            },
            conversations: async (goal) => {
                return await findRelatedEntities(goal._id, Conversations, 'goalIds')
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'goal', _id)
            },
        },
        Topic: {
            type() {
                return 'topic'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            essays: async (topic) => {
                return await findRelatedEntities(topic._id, Essays, 'topicIds')
            },
            speeches: async (topic) => {
                return await findRelatedEntities(topic._id, Speeches, 'topicIds')
            },
            conversations: async (topic) => {
                return await findRelatedEntities(topic._id, Conversations, 'topicIds')
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'topic', _id)
            },
        },
        Entry: {
            type() {
                return 'entry'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            goals: async({goalIds}) => {
                return await findByIds(Goals, goalIds)
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'entry', _id)
            },
        },
        Essay: {
            type() {
                return 'essay'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            reads: async({readIds}) => {
                return await findByIds(Reads, readIds)
            },
            topics: async({topicIds}) => {
                return await findByIds(Topics, topicIds)
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'essay', _id)
            },
        },
        Speech: {
            type() {
                return 'speech'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            reads: async({readIds}) => {
                return await findByIds(Reads, readIds)
            },
            topics: async({topicIds}) => {
                return await findByIds(Topics, topicIds)
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'speech', _id)
            },
        },
        Conversation: {
            type() {
                return 'conversation'
            },
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            reads: async({readIds}) => {
                return await findByIds(Reads, readIds)
            },
            goals: async({goalIds}) => {
                return await findByIds(Goals, goalIds)
            },
            topics: async({topicIds}) => {
                return await findByIds(Topics, topicIds)
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'conversation', _id)
            },
        },
        Comment: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            comments: async ({_id}) => {
                return await findComments(Comments, 'comment', _id)
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
                    'deleted-read': 'UpdatedRead',
                    'created-goal': 'UpdatedGoal',
                    'doing-goal': 'UpdatedGoal',
                    'done-goal': 'UpdatedGoal',
                    'deleted-goal': 'UpdatedGoal',
                    'created-topic': 'UpdatedTopic',
                    'updated-topic': 'UpdatedTopic',
                    'deleted-topic': 'UpdatedTopic',
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
            read: async ({readId}) => {
                return prepare(await Reads.findOne(ObjectId(readId)))
            },
        },
        UpdatedGoal: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            goal: async ({goalId}) => {
                return prepare(await Goals.findOne(ObjectId(goalId)))
            },
        },
        UpdatedTopic: {
            user: async ({userId}) => {
                return prepare(await Users.findOne(ObjectId(userId)))
            },
            topic: async ({topicId}) => {
                return prepare(await Topics.findOne(ObjectId(topicId)))
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
            updateReads: async (root, {readIds}, {userId}, info) => {
                return await updateOrderedEntities(userId, readIds, Reads, 'read', Users)
            },
            createRead: async (root, {read}, {userId}, info) => {
                return await createOrderedEntity(userId, read, Reads, Events, 'read', Users)
            },
            updateRead: async (root, {read}, {userId}, info) => {
                return await updateEntity(userId, read, Reads, Events, 'read', async (oldRead) => {
                    if (!oldRead.reading && read.reading) {
                        await Events.insert({
                            userId,
                            type: 'reading-read',
                            readId: oldRead._id,
                            date: new Date(),
                        })
                    }
                    if (!oldRead.read && read.read) {
                        await Events.insert({
                            userId,
                            type: 'read-read',
                            readId: oldRead._id,
                            date: new Date(),
                        })
                    }
                })
            },
            deleteRead: async (root, {_id}, {userId}, info) => {
                return await deleteOrderedEntity(userId, _id, Reads, Events, 'read', Users)
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
            updateGoals: async (root, {goalIds}, {userId}, info) => {
                return await updateOrderedEntities(userId, goalIds, Goals, 'goal', Users)
            },
            createGoal: async (root, {goal}, {userId}, info) => {
                return await createOrderedEntity(userId, goal, Goals, Events, 'goal', Users)
            },
            updateGoal: async (root, {goal}, {userId}, info) => {
                return await updateEntity(userId, goal, Goals, Events, 'goal', async (oldGoal) => {
                    if (!oldGoal.doing && goal.doing) {
                        await Events.insert({
                            userId,
                            type: 'doing-goal',
                            goalId: oldGoal._id,
                            date: new Date(),
                        })
                    }
                    if (!oldGoal.done && goal.done) {
                        await Events.insert({
                            userId,
                            type: 'done-goal',
                            goalId: oldGoal._id,
                            date: new Date(),
                        })
                    }
                })
            },
            deleteGoal: async (root, {_id}, {userId}, info) => {
                return await deleteOrderedEntity(userId, _id, Goals, Events, 'goal', Users)
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
            updateTopics: async (root, {topicIds}, {userId}, info) => {
                return await updateOrderedEntities(userId, topicIds, Topics, 'topic', Users)
            },
            createTopic: async (root, {topic}, {userId}, info) => {
                return await createOrderedEntity(userId, topic, Topics, Events, 'topic', Users)
            },
            updateTopic: async (root, {topic}, {userId}, info) => {
                return await updateEntity(userId, topic, Topics, Events, 'topic')
            },
            deleteTopic: async (root, {_id}, {userId}, info) => {
                return await deleteOrderedEntity(userId, _id, Topics, Events, 'topic', Users)
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