import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-goals">
        <div className="container">
            <UserGoals username={username}/>
        </div>
    </Layout>
))

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
            goals
        }
        goals {
            _id
            title
            description
            doing
            done
            entries {
                _id
                title
                url
            }
            conversations {
                _id
                title
            }
        }
    }
}
`
const UserGoalsComponent = (props) => {
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
    const {about, name, goals} = profile
    const emailHash = user.emailHash
    const goalsList = user.goals || []

    return <div>
        <UserHeader _id={_id} name={name} username={username} emailHash={emailHash} about={about} route="goals"/>
        <h2>Goals</h2>
        {goals &&
            <Markdown content={goals}/>
        }
        {goalsList.length > 0 ?
            <ul>
                {goalsList.map(({_id, title, description, doing, done, entries, conversations}, key) => {
                    const goalStatus = done ? 'done' : (doing ? 'doing' : 'not')
                    return <li key={key}>
                        <a href={`/goal/${_id}`}>{title}</a>
                        {goalStatus === 'doing' && <span> ⛏</span>}
                        {goalStatus === 'done' && <span> ✔</span>}
                        <ul>
                            {entries.length > 0 &&
                                <li>✎ Journal entries: 
                                    {entries.map((entry, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        {entry.url ?
                                            <span>
                                                <a href={entry.url} target="_blank">{entry.title}</a>
                                                {' '}(<a href={`/entry/${entry._id}`}>comments</a>)
                                            </span>
                                        :
                                            <a href={`/entry/${entry._id}`}>{entry.title}</a>
                                        }
                                    </span>))}
                                </li>
                            }
                            {conversations.length > 0 &&
                                <li>🗩 Conversations: 
                                    {conversations.map((conversation, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        <a href={`/conversation/${conversation._id}`}>{conversation.title}</a>
                                    </span>))}
                                </li>
                            }
                        </ul>
                    </li>
                })}
            </ul>
        :
            <p>No goals</p>
        }
    </div>   
}
const UserGoals = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserGoalsComponent)
