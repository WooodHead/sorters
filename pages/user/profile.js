import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-profile">
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
            reads {
                title
            }
            goals {
                title
            }
            entries {
                _id
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
    const {name, about, bio} = profile
    const {goals, entries, reads} = user

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
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="profile"/>
        <h2>Summary</h2>
        <ul>
            <li>{goals.length} <a href={`/u/${username}/goals`}>goals</a></li>
            <li>{entries.length} <a href={`/u/${username}/journal`}>journal entries</a></li>
            <li>{reads.length} <a href={`/u/${username}/reads`}>books in reading list</a></li>
        </ul>
        {urls.length > 0 && <div>
            <h2>Links</h2>
            <ul>
                {urls.map(({name, label, url}) => (
                    <li key={name}>
                        <label style={{
                            width: '100px',
                            marginRight: '24px'
                        }}>{label}</label>
                        <a href={profile[name]}>{profile[name]}</a>
                    </li>
                ))}
            </ul>
        </div>}
        {bio && 
            <div>
                <h2>Bio</h2>
                <Markdown content={bio}/>
            </div>
        }
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