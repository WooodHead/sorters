import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import Author from '../components/author'
import UserHeader from '../components/user-header'
import Related from '../components/related-entities'

export default withPage(({url: {query: {conversationId}}}) => (
    <Conversation conversationId={conversationId}/>
))

const ConversationQuery = gql`
    query($conversationId: ID!) {
        conversation(_id: $conversationId) {
            _id
            user {
                emailHash
                profile {
                    name
                    about
                }
                local {
                    username
                }
            }
            title
            url
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
            comments {
                _id
                user {
                    _id
                    emailHash
                    profile {
                        name
                    }
                    local {
                        username
                    }
                }
                content
                deleted
            }
        }
    }
`
const ConversationComponent = (props) => {
    const {data: {loading, conversation, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading conversation" page="user">
            <div className="container">
                <p>Loading...</p>
            </div>
        </Layout>
    }

    if (error) {
        return <Layout title="Error" page="user">
            <div className="container">
                <p>Error.</p>
            </div>
        </Layout>
    }

    if (!conversation) {
        return <Layout title="Invalid conversation" page="user">
            <div className="container">
                <p>Invalid conversation.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, content, reads, topics, goals, comments, user} = conversation
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash

    return <Layout title={title} page="user">
        <div className="container">
            <UserHeader _id={user._id} name={name} username={username} emailHash={emailHash} about={about} route="conversations" />
            <h1>
                {title}
            </h1>
            {content &&
                <Markdown content={content}/>
            }
            <Related entities={topics} label="Topics:" type="topic"/>
            <Related entities={reads} label="Books:" type="read"/>
            <Related entities={goals} label="Goals:" type="goal"/>
            <Comments comments={comments} entityType="conversation" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Conversation = compose(
    graphql(ConversationQuery, {
        options: ({conversationId}) => ({
            variables: {
                conversationId
            }
        })
    })
)(ConversationComponent)