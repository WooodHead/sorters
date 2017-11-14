import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'
import {PROGRAMS} from '../../models/programs'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user">
        <div className="container">
            <User username={username}/>
        </div>
    </Layout>
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
                ... on UpdatedTopic {
                    title
                    topic {
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
        return <p>Loading...</p>
    }

    if (error) {
        return <p>{error}</p>
    }

    if (!user) {
        return <p>Invalid user.</p>
    }

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

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="activity"/>
        <h2>Activity</h2>
        {events.map(event => <Event event={event} key={event._id} username={username}/>)}
    </div>
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
            return <Block>
                📖 Wants to read <a href={`/u/${username}/reads`}>{event.title}</a>.
            </Block>
        case 'reading-read':
            return <Block>
                👁 Started reading <a href={`/u/${username}/reads`}>{event.title}</a>.
            </Block>
        case 'read-read':
            return <Block>
                ✔ Finished reading <a href={`/u/${username}/reads`}>{event.title}</a>.
            </Block>
        case 'updated-goals':
            return <Block>
                📖 Updated <a href={`/u/${username}/goals`}>goals description</a>.
            </Block>
        case 'created-goal':
            return <Block>
                ◎ Wants to achieve <a href={`/u/${username}/goals`}>{event.title}</a>
            </Block>
        case 'doing-goal':
            return <Block>
               ⛏ Started working on <a href={`/u/${username}/goals`}>{event.title}</a>
            </Block>
        case 'done-goal':
            return <Block>
               ✔ Achieved <a href={`/u/${username}/goals`}>{event.title}</a>
            </Block>
        case 'updated-topics':
            return <Block>
                💡 Updated <a href={`/u/${username}/topics`}>topics description</a>.
            </Block>
        case 'created-topic':
            return <Block>
                ✎ Created topic <a href={`/u/${username}/topics`}>{event.title}</a>
            </Block>
        case 'created-entry':
            if (!event.entry) {
                return null
            }
            return <Block>
               ✎ Added a journal entry <a href={`/u/${username}/journal`}>{event.entry.title}</a>
            </Block>
        case 'updated-entry':
            return null
        case 'deleted-entry':
            return null
        case 'created-essay':
            if (!event.essay) {
                return null
            }
            return <Block>
               ✎ Wrote an essay <a href={`/u/${username}/essays`}>{event.essay.title}</a>
            </Block>
        case 'updated-essay':
            return null
        case 'deleted-essay':
            return null
        case 'created-speech':
            if (!event.speech) {
                return null
            }
            return <Block>
               👄 Spoke about <a href={`/u/${username}/speeches`}>{event.speech.title}</a>
            </Block>
        case 'updated-speech':
            return null
        case 'deleted-speech':
            return null
        case 'created-conversation':
            if (!event.conversation) {
                return null
            }
            return <Block>
               🗩 Started a conversation about <a href={`/u/${username}/conversation`}>{event.conversation.title}</a>
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
        marginBottom: '24px'
    }}>
        {children}
    </div>
)