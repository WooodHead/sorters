import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

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
                        articleUrl
                        videoUrl
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
        case 'spoke-about-read':
            if (!event.read) {
                return null
            }
            return <Block>
                👄 Spoke about <a href={event.read.videoUrl}>{event.title}</a>
            </Block>
        case 'wrote-about-read':
            if (!event.read) {
                return null
            }
            return <Block>
                ✎ Wrote about <a href={event.read.articleUrl}>{event.title}</a>
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
        case 'created-entry':
            if (!event.entry) {
                return null
            }
            return <Block>
               ✎ Added journal entry <a href={`/u/${username}/journal`}>{event.entry.title}</a>
            </Block>
        case 'updated-entry':
            return null
        case 'deleted-entry':
            return null
        default:
            console.warn(`Unknown event type ${event.type}.`)
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