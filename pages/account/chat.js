import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import {withUser} from 'ooth-client-react'

import withPage from '../../providers/page'
import Layout from '../../components/layout'
import Markdown from '../../components/markdown'
import Comments from '../../components/comments'
import Author from '../../components/author'
import AccountHeader from '../../components/account-header'
import withLoginRequired from 'staart/lib/hocs/login-required'

export default withPage(({url: {query: {chatId}}}) => {
    return <Chat chatId={chatId}/>
})

const ChatQuery = gql`
    query($chatId: ID!) {
        chat(_id: $chatId) {
            _id
            users {
                _id
                local {
                    username
                }
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
const ChatComponent = (props) => {
    const {user, data: {loading, chat, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading chat" page="user">
            <div className="container">
                <AccountHeader route="chat"/>
                <p>Loading...</p>
            </div>
        </Layout>
    }

    if (error) {
        return <Layout title="Error" page="user">
            <div className="container">
                <AccountHeader route="chat"/>
                <p>Error.</p>
            </div>
        </Layout>
    }

    if (!chat) {
        return <Layout title="Invalid chat" page="user">
            <div className="container">
                <AccountHeader route="chat"/>
                <p>Invalid chat.</p>
            </div>
        </Layout>
    }

    
    const {_id, comments, users} = chat
    console.log(users, user)
    const {local: {username}} = users.find(u => u._id !== user._id)

    return <Layout title="Private messages" page="user">
        <div className="container">
            <AccountHeader route="chat"/>
            <Comments comments={comments} entityType="chat" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch} title={`Private messages with ${username}`} commentLabel="Message" submitCommentLabel="Send message"/>
        </div>
    </Layout>
}
const Chat = compose(
    withLoginRequired('/account/messages'),
    withUser,
    graphql(ChatQuery, {
        options: (props) => {
            const {chatId} = props
            return {
                variables: {
                    chatId
                }
            }
        }
    }),
)(ChatComponent)
