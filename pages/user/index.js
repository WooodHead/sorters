import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'
import {PROGRAMS} from '../../models/programs'

export default withPage(({url: {query: {username}}}) => (
    <User username={username}/>
))

const urlFields = [
    {
        name: 'website',
        label: 'Website'
    },
    {
        name: 'blog',
        label: 'Blog'
    },
    {
        name: 'youtube',
        label: 'Youtube'
    },
    {
        name: 'twitter',
        label: 'Twitter'
    },
    {
        name: 'reddit',
        label: 'Reddit'
    },
    {
        name: 'patreon',
        label: 'Patreon'
    }
]

const UserQuery = gql`
    query($username: String!) {
        userByUsername(username: $username) {
            _id
            local {
                username
            }
            emailHash
            profile {
                name
                about
                bio
                website
                blog
                youtube
                twitter
                reddit
                patreon
            }
            events {
                _id
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
                ... on UpdatedTopic {
                    topic {
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
    }
`
const UserComponent = (props) => {
    const {data: {loading, userByUsername: user, error}} = props
    if (loading) {
        return <Layout title="Sorter" page="user">
            <div className="container">
                <p>Loading...</p>
            </div>
        </Layout>
    }

    if (error) {
        return <Layout title="Sorter" page="user">
            <div className="container">
                <p>{error}</p>
            </div>
        </Layout>
    }

    if (!user) {
        return <Layout title="Sorter" page="user">
            <div className="container">
                <p>Invalid user.</p>
            </div>
        </Layout>
    }

    const _id = user._id
    const username = user.local.username
    const emailHash = user.emailHash
    const profile = user.profile || {}
    const {name, about} = profile
    const {events} = user

    const urls = []
    urlFields.map(({name, label}) => {
        if (profile[name]) {
            urls.push({
                name,
                label,
                url: profile[name]
            })
        }
    })

    return <Layout title={username} page="user">
        <div className="container">
            <UserHeader _id={_id} name={name} username={username} emailHash={emailHash} about={about} route="activity"/>
            <h2>Activity</h2>
            {events.map(event => <Event event={event} key={event._id} username={username}/>)}
        </div>
    </Layout>
}
const User = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserComponent)

const Event = ({event, username}) => {
    switch (event.type) {
        case 'updated-profile':
            return <Block>
                👤 Updated <a href={`/u/${username}/profile`}>profile</a>.
            </Block>
        case 'completed-program':
            return <Block>
                ✔ Completed <a href={`/u/${username}/profile`}>{PROGRAMS[event.name]}</a>.
            </Block>
        case 'updated-reading':
            return <Block>
                📖 Updated <a href={`/u/${username}/reads`}>reading list description</a>.
            </Block>
        case 'created-read':
            return event.read && <Block>
                📖 Wants to read <a href={`/read/${event.read._id}`}>{event.read.title}</a>.
            </Block>
        case 'reading-read':
            return event.read && <Block>
                👁 Started reading <a href={`/read/${event.read._id}`}>{event.read.title}</a>.
            </Block>
        case 'read-read':
            return event.read && <Block>
                ✔ Finished reading <a href={`/read/${event.read._id}`}>{event.read.title}</a>.
            </Block>
        case 'updated-goals':
            return <Block>
                📖 Updated <a href={`/u/${username}/goals`}>goals description</a>.
            </Block>
        case 'created-goal':
            return event.goal && <Block>
                ◎ Wants to achieve <a href={`/goal/${event.goal._id}`}>{event.goal.title}</a>.
            </Block>
        case 'doing-goal':
            return event.goal && <Block>
               ⛏ Started working on <a href={`/goal/${event.goal._id}`}>{event.goal.title}</a>.
            </Block>
        case 'done-goal':
            return event.goal && <Block>
               ✔ Achieved <a href={`/goal/${event.goal._id}`}>{event.goal.title}</a>.
            </Block>
        case 'updated-topics':
            return <Block>
                💡 Updated <a href={`/u/${username}/topics`}>topics description</a>.
            </Block>
        case 'created-topic':
            return event.topic && <Block>
                ✎ Created topic <a href={`/topic/${event.topic._id}`}>{event.topic.title}</a>.
            </Block>
        case 'created-entry':
            return event.entry && <Block>
               ✎ Added a journal entry <a href={`/entry/${event.entry._id}`}>{event.entry.title}</a>.
            </Block>
        case 'updated-entry':
            return null
        case 'deleted-entry':
            return null
        case 'created-essay':
            return event.essay && <Block>
               ✎ Wrote an essay <a href={`/essay/${event.essay._id}`}>{event.essay.title}</a>.
            </Block>
        case 'updated-essay':
            return null
        case 'deleted-essay':
            return null
        case 'created-speech':
            return event.speech && <Block>
               👄 Spoke about <a href={`/speech/${event.speech._id}`}>{event.speech.title}</a>.
            </Block>
        case 'updated-speech':
            return null
        case 'deleted-speech':
            return null
        case 'created-conversation':
            return event.conversation && <Block>
               🗩 Started a conversation about <a href={`/conversation/${event.conversation._id}`}>{event.conversation.title}</a>
            </Block>
        case 'updated-conversation':
            return null
        case 'deleted-conversation':
            return null
        default:
            console.warn(`Unknown event type ${event.type}.`, event)
            return null
    }
}

const Block = ({children}) => (
    <div style={{
        marginBottom: '1.5rem'
    }}>
        {children}
    </div>
)
