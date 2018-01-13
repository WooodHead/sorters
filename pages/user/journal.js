import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import Gravatar from 'react-gravatar'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-journal">
        <div className="container">
            <UserJournal username={username}/>
        </div>
    </Layout>
))

const UserJournalQuery = gql`
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
            }
            entries {
                _id
                title
                url
                description
                goals {
                    _id
                    title
                }
            }
        }
    }
`
const UserJournalComponent = (props) => {
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
    
    const _id = user._id
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash
    const entries = user.entries

    return <div>
        <UserHeader _id={_id} name={name} username={username} emailHash={emailHash} about={about} route="journal"/>
        <h2>Journal</h2>
        {entries.length > 0 ?
            entries.map((entry) => (
                <Entry
                    key={entry._id}
                    entry={entry}
                />
            ))
        : <p>No journal entries.</p>}
    </div>
}
const UserJournal = compose(
    graphql(UserJournalQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserJournalComponent)

const Entry = ({entry: {_id, url, title, description, goals}}) => (
    <div style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
    }}>
        <h3>
            {url ?
                <a href={url} target="_blank">{title}</a>
            :
                <a href={`/entry/${_id}`}>{title}</a>
            }
        </h3>
        {description &&
            <Markdown content={description}/>
        }
        {goals.length > 0 &&
            <div>
                Goals: {goals.map(({_id, title}, i) => (
                    <span key={i}>{i ? ', ' : ' '}<a href={`/goal/${_id}`}>{title}</a></span>
                ))}
            </div>
        }
        <a href={`/entry/${_id}`}>Comments</a>
        <hr/>
    </div>
)