import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import Gravatar from 'react-gravatar'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-conversations">
        <div className="container">
            <UserConversations username={username}/>
        </div>
    </Layout>
))

const UserConversationsQuery = gql`
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
            conversations {
                _id
                title
                content
                topics {
                    _id
                    title
                }
                reads {
                    _id
                    title
                }
                goals {
                    _id
                    title
                }
            }
        }
    }
`
const UserConversationsComponent = (props) => {
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
    const conversations = user.conversations

    return <div>
        <UserHeader id={_id} name={name} username={username} emailHash={emailHash} about={about} route="conversations"/>
        <h2>Conversations</h2>
        {conversations.length > 0 ?
            conversations.map((conversation) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                />
            ))
        : <p>No conversation.</p>}
    </div>
}
const UserConversations = compose(
    graphql(UserConversationsQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserConversationsComponent)

const Conversation = ({conversation: {_id, url, title, content, topics, reads, goals}}) => (
    <div style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
    }}>
        <h3>
            <a href={`/conversation/${_id}`}>
                {title}
            </a>
        </h3>
        {content &&
            <Markdown content={content}/>
        }
        {topics.length > 0 &&
            <div>
                Topics: {topics.map(({_id, title}, i) => (
                    <span key={i}>{i ? ', ' : ' '}<a href={`/topic/${_id}`}>{title}</a></span>
                ))}
            </div>
        }
        {reads.length > 0 &&
            <div>
                Books: {reads.map(({_id, title}, i) => (
                    <span key={i}>{i ? ', ' : ' '}<a href={`/read/${_id}`}>{title}</a></span>
                ))}
            </div>
        }
        {goals.length > 0 &&
            <div>
                Goals: {goals.map(({_id, title}, i) => (
                    <span key={i}>{i ? ', ' : ' '}<a href={`/goal${_id}`}>{title}</a></span>
                ))}
            </div>
        }
        <a href={`/conversation/${_id}`}>Comments</a>
        <hr/>
    </div>
)