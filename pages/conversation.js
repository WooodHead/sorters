import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import Author from '../components/author'

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
                }
                local {
                    username
                }
            }
            title
            url
            content
            topicTitles
            readTitles
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

    const {_id, title, url, content, readTitles, topicTitles, comments, user} = conversation

    return <Layout title={title} page="user">
        <div className="container">
            <h1>
                {url ?
                    <a href={url}>{title}</a>
                :
                    title
                }
            </h1>
            <Author user={user}/>
            {content &&
                <Markdown content={content}/>
            }
            {readTitles.length > 0 &&
                <div>
                    Books: {readTitles.map((read, i) => (
                        <span key={i}>{i ? ', ' : ' '}<em>{read}</em></span>
                    ))}
                </div>
            }
            {topicTitles.length > 0 &&
                <div>
                    Topics: {topicTitles.map((topic, i) => (
                        <span key={i}>{i ? ', ' : ' '}<em>{topic}</em></span>
                    ))}
                </div>
            }
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