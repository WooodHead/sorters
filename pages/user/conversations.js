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
                topicTitles
                readTitles
                goalTitles
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
    
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash
    const conversations = user.conversations

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="conversations"/>
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

const Conversation = ({conversation: {_id, url, title, content, topicTitles, readTitles, goalTitles}}) => (
    <div style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
    }}>
        <h3>
            {title}
        </h3>
        {content &&
            <Markdown content={content}/>
        }
        {topicTitles.length > 0 &&
            <div>
                Topics: {topicTitles.map((topic, i) => (
                    <span key={i}>{i ? ', ' : ' '}<em>{topic}</em></span>
                ))}
            </div>
        }
        {readTitles.length > 0 &&
            <div>
                Books: {readTitles.map((read, i) => (
                    <span key={i}>{i ? ', ' : ' '}<em>{read}</em></span>
                ))}
            </div>
        }
        {goalTitles.length > 0 &&
            <div>
                Goals: {goalTitles.map((goal, i) => (
                    <span key={i}>{i ? ', ' : ' '}<em>{goal}</em></span>
                ))}
            </div>
        }
        <a href={`/conversation/${_id}`}>Comments</a>
        <hr/>
    </div>
)