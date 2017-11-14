import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Gravatar from 'react-gravatar'
import moment from 'moment'
import {PROGRAMS} from '../models/programs'

const digestEvents = (events) => {
    const byDayUser = {}
    for (const event of events) {
        if (!event.user.local || !event.user.local.username) {
            continue
        }
        const day = moment(event.date).format('YYYYMMDD')
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

const EVENTS_WITH_TITLE = {
    title: {
        read: ['created-read', 'reading-read', 'read-read'],
        goal: ['created-goal', 'doing-goal', 'done-goal'],
        topic: ['created-topic'],
    },
    _id: {
        entry: ['created-entry'],
        essay: ['created-essay'],
        speech: ['created-speech'],
        conversation: ['created-conversation'],
    },
}

const IGNORED_EVENTS = [
    'updated-entry',
    'deleted-entry',
    'updated-essay',
    'deleted-essay',
    'updated-speech',
    'deleted-speech',
    'updated-conversation',
    'deleted-conversation',
]

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
    } else if (IGNORED_EVENTS.indexOf(event.type) > -1) {
        return
    } else {
        let found = false
        for (const identifierKey of Object.keys(EVENTS_WITH_TITLE)) {
            for (const key of Object.keys(EVENTS_WITH_TITLE[identifierKey])) {
                if (EVENTS_WITH_TITLE[identifierKey][key].indexOf(event.type) > -1) {
                    if (!event[key]) {
                        return
                    }
                    found = true
                    if (!integrated[event.type]) {
                        integrated[event.type] = {}
                    }
                    integrated[event.type][event[key][identifierKey]] = event
                }
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
                title
                read {
                    title
                    read
                }
            }
            ... on UpdatedGoal {
                title
                goal {
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
                title
                topic {
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
                    return <div key={j} style={{
                        marginBottom: '24px',
                        display: 'flex',
                    }}>
                        <div>
                            <a href={`/u/${username}`}>
                                <Gravatar md5={emailHash || username} size={75} style={{
                                    marginRight: '24px',
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
                                    👤 Updated <a href={`/u/${username}/profile`}>profile</a>
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
                                {event['created-entry'] && <li>
                                    ✎ Added to journal:
                                    {Object.keys(event['created-entry']).slice(0, LIMIT).sort().map((t, i) => {
                                        const {title, url} = event['created-entry'][t].entry
                                        return <span key={i}>
                                            {i ? ', ' : ' '}
                                            {url ?
                                                <a href={url}>{title}</a>
                                            :
                                                <a href={`/u/${username}/journal`}>{title}</a>
                                            }
                                        </span>
                                    })}
                                    {Object.keys(event['created-entry']).length > LIMIT && <span> and {Object.keys(event['created-entry']).length - LIMIT} more</span>}
                                </li>}
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
                                {event['done-goal'] && <li>
                                    ✔ Achieved
                                    {Object.keys(event['done-goal']).slice(0, LIMIT).sort().map((t, i) => <span key={i}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                        </span>)}
                                    {Object.keys(event['done-goal']).length > LIMIT && <span> and {Object.keys(event['done-goal']).length - LIMIT} more</span>}
                                </li>}
                                {event['created-essay'] && <li>
                                    ✎ Wrote
                                    {Object.keys(event['created-essay']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}
                                        <a href={event['created-essay'][t].essay.url}>
                                            {event['created-essay'][t].essay.title}
                                        </a>
                                    </span>)}
                                    {Object.keys(event['created-essay']).length > LIMIT && <span> and {Object.keys(event['created-essay']).length - LIMIT} more</span>}
                                </li>}
                                {event['created-speech'] && <li>
                                    👄 Spoke about
                                    {Object.keys(event['created-speech']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}
                                        <a href={event['created-speech'][t].speech.url}>
                                            {event['created-speech'][t].speech.title}
                                        </a>
                                    </span>)}
                                    {Object.keys(event['created-speech']).length > LIMIT && <span> and {Object.keys(event['created-speech']).length - LIMIT} more</span>}
                                </li>}
                                {event['created-conversation'] && <li>
                                    🗩 Started a conversation about
                                    {Object.keys(event['created-conversation']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}
                                        <a href={`/conversation/${event['created-conversation'][t].conversation._id}`}>
                                            {event['created-conversation'][t].conversation.title}
                                        </a>
                                    </span>)}
                                    {Object.keys(event['created-conversation']).length > LIMIT && <span> and {Object.keys(event['created-conversation']).length - LIMIT} more</span>}
                                </li>}
                                {event['read-read'] && <li>
                                    📖 Read
                                    {Object.keys(event['read-read']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                    </span>)}
                                    {Object.keys(event['read-read']).length > LIMIT && <span> and {Object.keys(event['read-read']).length - LIMIT} more</span>}
                                </li>}
                                {event['doing-goal'] && <li>
                                    ⛏ Is working on
                                    {Object.keys(event['doing-goal']).slice(0, LIMIT).sort().map((t, i) => <span key={i}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                    </span>)}
                                    {Object.keys(event['doing-goal']).length > LIMIT && <span> and {Object.keys(event['doing-goal']).length - LIMIT} more</span>}
                                </li>}
                                {event['reading-read'] && <li>
                                    👁 Started reading 
                                    {Object.keys(event['reading-read']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                    </span>)}
                                    {Object.keys(event['reading-read']).length > LIMIT && <span> and {Object.keys(event['reading-read']).length - LIMIT} more</span>}
                                </li>}
                                {event.updatedGoals && <li>
                                    ◎ Updated <a href={`/u/${username}/goals`}>goals description</a>.
                                </li>}
                                {event['created-goal'] && <li>
                                    ◎ Wants to achieve
                                    {Object.keys(event['created-goal']).slice(0, LIMIT).sort().map((t, i) => <span key={i}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                    </span>)}
                                    {Object.keys(event['created-goal']).length > LIMIT && <span> and {Object.keys(event['created-goal']).length - LIMIT} more</span>}
                                </li>}
                                {event.updatedReading && <li>
                                    📖 Updated <a href={`/u/${username}/reads`}>reading list description</a>.
                                </li>}
                                {event['created-read'] && <li>
                                    📖 Added books to <a href={`/u/${username}/reads`}>reading list</a>: 
                                    {Object.keys(event['created-read']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}<em>{t}</em>
                                    </span>)}
                                    {Object.keys(event['created-read']).length > LIMIT && <span> and {Object.keys(event['created-read']).length - LIMIT} more</span>}
                                </li>}
                                {event.updatedTopics && <li>
                                    💡 Updated <a href={`/u/${username}/topics`}>topics description</a>.
                                </li>}
                                {event['created-topic'] && <li>
                                    💡 Is interested in:
                                    {Object.keys(event['created-topic']).slice(0, LIMIT).sort().map((t, i) => <span key={t}>
                                        {i ? ', ' : ' '}<a href={`/u/${username}/topics`}>{t}</a>
                                    </span>)}
                                    {Object.keys(event['created-topic']).length > LIMIT && <span> and {Object.keys(event['created-read']).length - LIMIT} more</span>}
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