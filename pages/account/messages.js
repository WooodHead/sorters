import {Component} from 'react'
import {compose} from 'recompose'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import gql from 'graphql-tag'
import {graphql} from 'react-apollo'
import {withUser} from 'ooth-client-react'
import Gravatar from 'react-gravatar'
import _ from 'lodash'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import Markdown from '../../components/markdown'
import AccountHeader from '../../components/account-header'

export default withPage(() => (
    <Layout title="Messages" page="messages">
        <Inbox/>
    </Layout>
))

const InboxQuery = gql`
    query {
        me {
            chats {
                _id
                users {
                    _id
                    emailHash
                    local {
                        username
                    }
                }
                lastComment {
                    user {
                        _id
                        emailHash
                        local {
                            username
                        }
                    }
                    content
                    createdAt
                }
            }
        }
    }
`
class InboxComponent extends Component {
    render() {
        const {
            user,
            data: {loading, me, refetch},
        } = this.props;

        const chats = _.cloneDeep(me.chats).sort((a, b) => b.lastComment.createdAt - a.lastComment.createdAt)

        return <div className="container">
            <AccountHeader route="messages"/>
            <h2>Private messages</h2>
            {loading ?
                <span>Loading...</span>
            :
                (me.chats.length > 0 ?
                    <div>
                        {chats.map(({_id, users, lastComment: {content}}) => {
                            const {emailHash, local: {username}} = users.find(u => u._id !== user._id)
                            return <a href={`/account/chat/${_id}`}>
                                <div
                                    key={_id}
                                    style={{
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                    }}
                                >
                                    <div>
                                        <Gravatar md5={emailHash || username} size={48} style={{
                                            marginRight: '1.5rem',
                                        }}/>
                                    </div>
                                    <div>
                                        {username}
                                        <Markdown content={content}/>
                                    </div>
                                </div>
                            </a>
                        })}
                    </div>
                :
                    <p>Inbox empty.</p>
                )
            }
        </div>
    }
}
const Inbox = compose(
    withLoginRequired('/account/messages'),
    withUser,
    graphql(InboxQuery),
)(InboxComponent)
