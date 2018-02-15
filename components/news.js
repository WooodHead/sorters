import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Gravatar from 'react-gravatar'
import moment from 'moment'
import _ from 'lodash'

import {PROGRAMS} from '../models/programs'
import {IGNORED_EVENTS} from '../models/events'
import {log} from '../utils/debug'
import {Avatar} from '../components/user'
import {EntityLink} from '../components/entity'

const digestEvents = (events) => {
    const byDayUser = {}
    for (let event of events) {
        if (!event.user || !event.user.local || !event.user.local.username) {
            continue
        }
        const day = moment(event.date).format('YYYYMMDD')

        if (event.type === 'created-comment') {
            if (!event.comment || event.comment.deleted || !event.comment.rootEntity) {
                continue
            }
            event = _.cloneDeep(event)
            event.commenter = event.user
            event.user = event.comment.rootEntity.user
        }

        const userId = event.user._id
        if (!byDayUser[day]) {
            byDayUser[day] = {}
        }
        if (!byDayUser[day][userId]) {
            byDayUser[day][userId] = {
                user: event.user,
                date: event.date,
            }
        }
        integrateEvent(byDayUser[day][userId], event)
    }
    const days = Object.keys(byDayUser)
        .sort().reverse()
        .map(d => {
            const day = byDayUser[d]
            return Object.keys(day)
                .map(k => day[k])
                .filter(event => Object.keys(event).length > 2)
                .sort((a, b) => b.date - a.date)
        })
        .filter(events => events.length)
    return days
}

const PROFILE_FIELDS = {
    name: 'Name',
    about: 'About',
    bio: 'Bio',
    website: 'Website',
    blog: 'Blog',
    youtube: 'Youtube',
    twitter: 'Twitter',
    reddit: 'Reddit',
    patreon: 'Patreon',
    gender: 'Gender',
    birthDate: 'Date of birth',
    city: 'City',
    country: 'Country',
    agreeableness: 'Agreeableness',
    compassion: 'Compassion',
    politeness: 'Politeness',
    conscientiousness: 'Conscientiousness',
    industriousness: 'Industriousness',
    orderliness: 'Orderliness',
    extraversion: 'Extraversion',
    enthusiasm: 'Enthusiasm',
    assertiveness: 'Assortiveness',
    neuroticism: 'Neuroticism',
    withdrawal: 'Withdrawal',
    volatility: 'Volatility',
    opennessToExperience: 'Openness to Experience',
    intellect: 'Intellect',
    openness: 'Openness',
}

const EVENTS_WITH_ENTITY = {
    read: ['created-read', 'reading-read', 'read-read'],
    goal: ['created-goal', 'doing-goal', 'done-goal'],
    topic: ['created-topic'],
    entry: ['created-entry'],
    essay: ['created-essay'],
    speech: ['created-speech'],
    conversation: ['created-conversation'],
}

const integrateEvent = (integrated, event) => {
    if (event.type === 'updated-profile') {
        if (!integrated.updatedProfile) {
            integrated.updatedProfile = {}
        }
        if (event.values) {
            for (const key of event.values) {
                if (PROFILE_FIELDS[key]) {
                    integrated.updatedProfile[key] = true
                }
            }
        }
    } else if (event.type === 'updated-reading') {
        integrated.updatedReading = true
    } else if (event.type === 'updated-goals') {
        integrated.updatedGoals = true
    } else if (event.type === 'updated-topics') {
        integrated.updatedTopics = true
    } else if (event.type === 'completed-program') {
        if (PROGRAMS[event.name]) {
            integrated[event.name] = true
        }
        else throw new Error(`Unknown program type: ${event.name}`)
    } else if (event.type === 'created-comment') {
        if (!integrated['created-comment']) {
            integrated['created-comment'] = {}
        }
        if (!event.comment.rootEntity) {
            return
        }
        if (!integrated['created-comment'][event.comment.rootEntity._id]) {
            integrated['created-comment'][event.comment.rootEntity._id] = event.comment.rootEntity
            integrated['created-comment'][event.comment.rootEntity._id].commenters = {}
        }
        integrated['created-comment'][event.comment.rootEntity._id].commenters[event.commenter._id] = event.commenter
    } else if (IGNORED_EVENTS.indexOf(event.type) > -1) {
        return
    } else {
        let found = false
        for (const key of Object.keys(EVENTS_WITH_ENTITY)) {
            if (EVENTS_WITH_ENTITY[key].indexOf(event.type) > -1) {
                if (!event[key]) {
                    return
                }
                found = true
                if (!integrated[event.type]) {
                    integrated[event.type] = {}
                }
                integrated[event.type][event[key]._id] = event
            }
        }
        if (!found) {
            throw new Error(`Unknown event type: ${event.type}.`)
        }
    }

    if (event.date > integrated.date) {
        integrated.date = event.date
    }
}

const LIMIT = 5

const NewsQuery = gql`
    query($limit: Int) {
        events(limit: $limit) {
            user {
                _id
                profile {
                    name
                }
                emailHash
                local {
                    username
                }
            }
            type
            date
            ... on UpdatedRead {
                read {
                    _id
                    title
                    read
                }
            }
            ... on UpdatedGoal {
                goal {
                    _id
                    title
                }
            }
            ... on UpdatedEntry {
                entry {
                    _id
                    title
                    url
                }
            }
            ... on UpdatedTopic {
                topic {
                    _id
                    title
                }
            }
            ... on UpdatedEssay {
                essay {
                    _id
                    title
                    url
                }
            }
            ... on UpdatedSpeech {
                speech {
                    _id
                    title
                    url
                }
            }
            ... on UpdatedConversation {
                conversation {
                    _id
                    title
                }
            }
            ... on UpdatedValue {
                name
            }
            ... on UpdatedProfile {
                values
            }
            ... on UpdatedComment {
                comment {
                    rootEntity {
                        type
                        _id
                        title
                        user {
                            _id
                            profile {
                                name
                            }
                            emailHash
                            local {
                                username
                            }
                        }        
                    }
                    content
                    deleted
                }
            }
        }
    }
`
const NewsComponent = ({data: {loading, events}}) => {
    if (loading) {
        return <p>Loading...</p>
    }
    const days = digestEvents(events)

    return <div>
        {days.map((day, i) => {
            return <div key={i}>
                {day.map((event, j) => {
                    const {emailHash, local: {username}} = event.user
                    const name = event.user.profile && event.user.profile.name
                    return <div key={username} style={{
                        marginBottom: '1.5rem',
                        display: 'flex',
                    }}>
                        <div>
                            <a href={`/u/${username}`}>
                                <Gravatar md5={emailHash || username} size={75} style={{
                                    marginRight: '1.5rem',
                                }}/>
                            </a>
                        </div>
                        <div>
                            <h4 style={{
                                marginTop: 0
                            }}>
                                <a href={`/u/${username}`}>
                                    {name || username}
                                </a>
                            </h4>
                            <ul style={{
                                paddingLeft: 0,
                                listStylePosition: 'inside',
                            }}>
                                {event.updatedProfile && <li>
                                    👤 Updated <a href={`/u/${username}/profile`}>profile</a>{' '}
                                    {Object.keys(event.updatedProfile).length > 0 && <span>: 
                                        {Object.keys(event.updatedProfile).slice(0, LIMIT).map((name, i) =>
                                            <span key={i}>
                                                {i ? ', ' : ''}
                                                {PROFILE_FIELDS[name]}
                                            </span>
                                        )}
                                        {Object.keys(event.updatedProfile).length > LIMIT && <span> and {Object.keys(event.updatedProfile).length - LIMIT} more</span>}
                                    </span>}
                                    .
                                </li>}
                                <Entities label="✎ Added to journal" entities={event['created-entry']} type="entry"/>
                                {event.selfAuthoringPast && <li>
                                    ✔ Completed {PROGRAMS.selfAuthoringPast}
                                </li>}
                                {event.selfAuthoringPresentFaults && <li>
                                    ✔ Completed {PROGRAMS.selfAuthoringPresentFaults}
                                </li>}
                                {event.selfAuthoringPresentVirtues && <li>
                                    ✔ Completed {PROGRAMS.selfAuthoringPresentVirtues}
                                </li>}
                                {event.selfAuthoringFuture && <li>
                                    ✔ Completed {PROGRAMS.selfAuthoringFuture}
                                </li>}
                                {event.understandMyself && <li>
                                    ✔ Completed {PROGRAMS.understandMyself}
                                </li>}
                                <Entities label="✔ Achieved" entities={event['done-goal']} type="goal"/>
                                <Entities label="✎ Wrote" entities={event['created-essay']} type="essay"/>
                                <Entities label="👄 Spoke about" entities={event['created-speech']} type="speech"/>
                                <Entities label="🗩 Started a conversation about" entities={event['created-conversation']} type="conversation"/>
                                <Entities label="📖 Read" entities={event['read-read']} type="read"/>
                                <Entities label="⛏ Is working on" entities={event['doing-goal']} type="goal"/>
                                <Entities label="👁 Started reading" entities={event['reading-read']} type="read"/>
                                {event.updatedGoals && <li>
                                    ◎ Updated <a href={`/u/${username}/goals`}>goals description</a>.
                                </li>}
                                <Entities label="◎ Wants to achieve" entities={event['created-goal']} type="goal"/>
                                {event.updatedReading && <li>
                                    📖 Updated <a href={`/u/${username}/reads`}>reading list description</a>.
                                </li>}
                                <Entities label="📖 Wants to read" entities={event['created-read']} type="read"/>
                                {event.updatedTopics && <li>
                                    💡 Updated <a href={`/u/${username}/topics`}>topics description</a>.
                                </li>}
                                <Entities label="💡 Is interested in" entities={event['created-topic']} type="topic"/>
                                {event['created-comment'] && <li>
                                    🗩 Had comments on
                                    <ul>
                                        {Object.values(event['created-comment']).map(entity => {
                                            return <li key={entity._id} style={{ lineHeight: 2 }}>
                                                <EntityLink entity={entity}/>
                                                {Object.keys(entity.commenters).length > 0 && <span>
                                                    {' by'}
                                                    {Object.values(entity.commenters).map((user, i) => <span key={i}>
                                                        {' '}
                                                        <Avatar user={user}/>
                                                    </span>)}
                                                </span>}
                                            </li>
                                        })}
                                    </ul>
                                </li>}
                            </ul>
                        </div>
                    </div>
                })}
            </div>
        })}
    </div>
}
const News = compose(
    graphql(NewsQuery, {
        options: ({limit}) => ({
            variables: {
                limit
            }
        })
    })
)(NewsComponent)

export default News

const Entities = ({entities, type, label}) => {
    if (entities) {
        return <li>
            {label}{' '}
            <span>
                {Object.keys(entities).sort().slice(0, LIMIT).map((t, i) => {
                    const {_id, title, url} = entities[t][type]
                    return <span key={i}>
                        {i ? ', ' : ' '}
                        {url ?
                            <span><a href={url} target="_blank">{title}</a> (<a href={`/${type}/${_id}`}>comments</a>)</span>
                        :
                            <a href={`/${type}/${_id}`}>{title}</a>
                        }
                    </span>
                })}
                {Object.keys(entities).length > LIMIT && <span> and {Object.keys(entities).length - LIMIT} more</span>}
            </span>
        </li>
    } else {
        return null
    }
}