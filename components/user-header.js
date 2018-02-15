import Markdown from '../components/markdown'
import Gravatar from 'react-gravatar'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import React from 'react'
import withRouter from 'staart/lib/hocs/router'
import ShyButton from '../components/shy-button'
import Form from 'staart/lib/components/form'
import {errorMessage} from '../utils/errors'
import {withUser} from 'ooth-client-react'
import {username} from './user'

const MENU = [
    {
        url: '',
        name: 'activity',
        label: '⛏ Activity',
    },
    {
        url: '/profile',
        name: 'profile',
        label: '👤 Profile',
    },
    {
        url: '/goals',
        name: 'goals',
        label: '◎ Goals',
    },
    {
        url: '/journal',
        name: 'journal',
        label: '✎ Journal',
    },
    {
        url: '/reads',
        name: 'reads',
        label: '📖 Books',
    },
    {
        url: '/topics',
        name: 'topics',
        label: '💡 Topics',
    },
    {
        url: '/essays',
        name: 'essays',
        label: '✎ Essays',
    },
    {
        url: '/speeches',
        name: 'speeches',
        label: '👄 Speeches',
    },
    {
        url: '/conversations',
        name: 'conversations',
        label: '🗩 Conversations',
    },
]

export default ({_id, name, username, emailHash, about, route}) => (
    <div>
        <h1>
            {name || username}
        </h1>
        <div className="row">
            <div className="col-xs-6 col-sm-3 col-md-2">
                <Gravatar md5={emailHash || username} size={200} style={{
                    marginBottom: '1.5rem',
                    width: '100%',
                    height: 'auto',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    display: 'block'
                }}/>
            </div>
            <div className="col-xs-12 col-sm-9 col-md-10">
                <p><a href={`/u/${username}`}>/u/{username}</a></p>
                {about && 
                    <div>
                        <Markdown content={about}/>
                    </div>
                }
                <SendMessage userId={_id}/>
            </div>
        </div>
        <ul className="nav nav-tabs">
            {MENU.map(({url, name, label}) => <li key={name} role="presentation" className={route === name && 'active'}>
                <a href={`/u/${username}${url}`}>{label}</a>
            </li>)}
        </ul>
    </div>
)

const SendMessageQuery = gql`
    mutation($userId: ID!, $message: String!) {
        createChat(userId: $userId, message: $message) {
            _id
        }
    }
`
class SendMessageComponent extends React.Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {user, sendMessage, userId, Router} = this.props

        if (!user) {
            return null
        }

        if (!username(user)) {
            return <div className="alert alert-info">
                <p>
                    Set a <a href="/account/account" style={{ fontWeight: 'bold' }}>username</a> to leave a comment.
                </p>
            </div>
        }

        if (!this.state.edit) {
            return <button
                className="btn btn-primary"
                onClick={() => this.setState({edit: true})}
            >Send message</button>
        }

        return <Form
            onSubmit={() => {
                sendMessage({
                    variables: {
                        userId,
                        message: this.message.value,
                    },
                }).then(({data: {createChat: {_id}}}) => {
                    Router.push(`/account/chat?chatId=${_id}`, `/account/chat/${_id}`)
                }).catch(e => {
                    this.setState({
                        state: 'error',
                        message: errorMessage(e),
                    })
                })
            }}
            state={this.state.state}
            message={this.state.message}
            submitLabel="Send private message"
        >
            <span
                style={{
                    display: 'block',
                    float: 'right',
                }}
            >
                <ShyButton
                    onClick={() => {
                        this.setState({
                            edit: false,
                        })
                    }}
                >✕</ShyButton>{' '}
            </span>
            <div className="form-group">
                <label htmlFor="content">Message</label>
                <textarea
                    className="form-control"
                    rows="4"
                    ref={ref => this.message = ref}
                />
            </div>
        </Form>
    }
}
const SendMessage = compose(
    withUser,
    graphql(SendMessageQuery, {
        name: 'sendMessage',
    }),
    withRouter,
)(SendMessageComponent)