import {Component} from 'react'
import {compose} from 'recompose'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import gql from 'graphql-tag'
import {graphql} from 'react-apollo'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import Markdown from '../../components/markdown'
import {errorMessage} from '../../utils/errors'
import ShyButton from '../../components/shy-button'
import DeleteModal from '../../components/delete-modal'
import CheckButtons from '../../components/check-buttons'
import Panel from '../../components/panel'

export default withPage(() => (
    <Layout title="Conversations" page="conversations">
        <Conversations/>
    </Layout>
))

const ConversationesQuery = gql`
    query {
        me {
            local {
                username
            }
            conversations {
                _id
                title
                content
                topicTitles
                readTitles
                goalTitles
            }
            topics {
                title
            }
            reads {
                title
            }
            goals {
                title
            }
        }
    }
`
const CreateConversationQuery = gql`
    mutation($conversation: NewConversationInput!) {
        createConversation(conversation: $conversation) {
            _id
        }
    }
`
const UpdateConversationQuery = gql`
    mutation($conversation: ConversationInput!) {
        updateConversation(conversation: $conversation) {
            _id
        }
    }
`
const DeleteConversationQuery = gql`
    mutation($_id: ID!) {
        deleteConversation(_id: $_id) {
            _id
        }
    }
`
class ConversationesComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            conversations: {loading, me, refetch},
            updateConversation,
            createConversation,
            deleteConversation,
        } = this.props

        const username = me && me.local && me.local.username
        const conversations = (me && me.conversations && me.conversations.map(({
            _id,
            title,
            content,
            readTitles,
            topicTitles,
            goalTitles,
        }) => ({
            _id,
            title,
            content,
            topicTitles,
            readTitles,
            goalTitles,
        }))) || []
        const topicTitles = (me && me.topics && me.topics.map(topic => topic.title)) || []
        const readTitles = (me && me.reads && me.reads.map(read => read.title)) || []
        const goalTitles = (me && me.goals && me.goals.map(goal => goal.title)) || []
        
        const topics = {}
        for (const title of topicTitles) {
            topics[title] = {
                label: title
            }
        }
        const reads = {}
        for (const title of readTitles) {
            reads[title] = {
                label: title
            }
        }
        const goals = {}
        for (const title of goalTitles) {
            goals[title] = {
                label: title
            }
        }

        return <div style={{
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <h1>Conversations</h1>
            <p>Here you can start conversations about the <a href="/account/topics">topics</a> you are interested in, about the <a href="/account/reads">books</a> you read or about the <a href="/account/goals">goals</a> you are pursuing.</p>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && conversations.length > 0 &&
                        <p>Your conversations can be found at <a href={`/u/${username}/conversations`}>/u/{username}/conversations</a>.</p>
                    }
                    {this.state.new ?
                        <Panel title="New Conversation"
                            onClose={() => {
                                this.setState({
                                    new: false
                                })
                            }}
                        >
                            <Form
                                onSubmit={() => {
                                    const topicTitles = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                                    const readTitles = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                                    const goalTitles = Object.values(this.goals.checks).filter(r => r.checked).map(r => r.value)
                                    const conversation = {
                                        title: this.title.value,
                                        content: this.content.value,
                                        topicTitles,
                                        readTitles,
                                        goalTitles,
                                    }
                                    createConversation({
                                        variables: {
                                            conversation,
                                        },
                                    }).then(() => {
                                        this.title.value = ''
                                        this.content.value = ''
                                        for (const check of Object.values(this.topics.checks)) {
                                            check.checked = false
                                        }
                                        for (const check of Object.values(this.reads.checks)) {
                                            check.checked = false
                                        }
                                        for (const check of Object.values(this.goals.checks)) {
                                            check.checked = false
                                        }
                                        this.setState({
                                            state: 'success',
                                            message: 'New conversation created',
                                            new: false,
                                        })
                                    })
                                    .then(refetch)
                                    .catch(e => {
                                        this.setState({
                                            state: 'error',
                                            message: errorMessage(e),
                                        })
                                    })
                                }}
                                state={this.state.state}
                                message={this.state.message}
                                submitLabel="New Conversation"
                            >
                                <div className="form-group">
                                    <label htmlFor="title">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder=""
                                        required
                                        ref={ref => {
                                            this.title = ref
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="content">Conversation</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        ref={ref => this.content = ref}
                                    />
                                </div>
                                <CheckButtons
                                    label="Topics"
                                    id="topics"
                                    values={topics}
                                    ref={ref => this.topics = ref}
                                />
                                <CheckButtons
                                    label="Books"
                                    id="reads"
                                    values={reads}
                                    ref={ref => this.reads = ref}
                                />
                                <CheckButtons
                                    label="Goals"
                                    id="goals"
                                    values={goals}
                                    ref={ref => this.goals = ref}
                                />
                            </Form>
                        </Panel>
                    :
                        <button
                            className="btn btn-primary"
                            onClick={() => this.setState({new: true})}>
                            New Conversation
                        </button>
                    }
                    {conversations.length > 0 &&
                        <div>
                            <h2>Conversations</h2>
                            {conversations.map((conversation) => (
                                <Conversation
                                    key={conversation._id}
                                    conversation={conversation}
                                    topicTitles={topicTitles}
                                    readTitles={readTitles}
                                    goalTitles={goalTitles}
                                    onUpdate={(conversation) => {
                                        return updateConversation({
                                            variables: {
                                                conversation,
                                            },
                                        }).then(refetch)
                                    }}
                                    onDelete={() => {
                                        return deleteConversation({
                                            variables: {
                                                _id: conversation._id,
                                            },
                                        }).then(refetch)
                                    }}
                                />
                            ))}
                        </div>
                    }
                </div>
            }
        </div>
    }
}
const Conversations = compose(
    withLoginRequired('/account/conversations'),
    graphql(ConversationesQuery, {
        name: 'conversations'
    }),
    graphql(UpdateConversationQuery, {
        name: 'updateConversation',
    }),
    graphql(CreateConversationQuery, {
        name: 'createConversation',
    }),
    graphql(DeleteConversationQuery, {
        name: 'deleteConversation',
    }),
)(ConversationesComponent)

class Conversation extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            conversation: {
                _id,
                title,
                content,
                topicTitles: conversationTopicTitles,
                readTitles: conversationReadTitles,
                goalTitles: conversationGoalTitles,
            },
            topicTitles,
            readTitles,
            goalTitles,
            onUpdate,
            onDelete
        } = this.props

        const topics = {}
        for (const title of topicTitles) {
            topics[title] = {
                label: title,
                default: conversationTopicTitles.indexOf(title) > -1,
            }
        }
        const reads = {}
        for (const title of readTitles) {
            reads[title] = {
                label: title,
                default: conversationReadTitles.indexOf(title) > -1,
            }
        }
        const goals = {}
        for (const title of goalTitles) {
            goals[title] = {
                label: title,
                default: conversationGoalTitles.indexOf(title) > -1,
            }
        }
            

        return <div style={{
            marginBottom: '1.5rem'
        }}>
            {this.state.edit ?
                <Panel title="Edit Conversation"
                    onClose={() => {
                        this.setState({
                            edit: false
                        })
                    }}
                >
                    <Form
                        onSubmit={() => {
                            const topicTitles = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                            const readTitles = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                            const goalTitles = Object.values(this.goals.checks).filter(r => r.checked).map(r => r.value)
                            const conversation = {
                                _id,
                                title: this.title.value,
                                content: this.content.value,
                                topicTitles,
                                readTitles,
                                goalTitles,
                            }
                            onUpdate(conversation)
                                .then(() => {
                                    this.setState({
                                        edit: false,
                                    })
                                }).catch(e => {
                                    this.setState({
                                        state: 'error',
                                        message: errorMessage(e),
                                    })
                                })
                        }}
                        state={this.state.state}
                        message={this.state.message}
                        submitLabel="Save"
                    >
                        <div className="form-group">
                            <label htmlFor="title">Title</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Cleaned my room"
                                required
                                ref={ref => {
                                    this.title = ref
                                }}
                                defaultValue={title}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="content">Conversation</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                ref={ref => this.content = ref}
                                defaultValue={content}
                            />
                        </div>
                        <CheckButtons
                            label="Topics"
                            id="topics"
                            values={topics}
                            ref={ref => this.topics = ref}
                        />
                        <CheckButtons
                            label="Reads"
                            id="reads"
                            values={reads}
                            ref={ref => this.reads = ref}
                        />
                        <CheckButtons
                            label="Goals"
                            id="goals"
                            values={goals}
                            ref={ref => this.goals = ref}
                        />
                    </Form>
                </Panel>
            :
                <div style={{
                    marginTop: '1.5rem',
                    marginBottom: '1.5rem',
                }}>
                    <span style={{
                        display: 'block',
                        float: 'right'
                    }}>
                        <DeleteModal
                            title="Delete conversation?"
                            message="A deleted conversation can't be recovered."
                            onDelete={onDelete}/>
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <h3>{title}</h3>
                    {content &&
                        <Markdown content={content}/>
                    }
                    {conversationTopicTitles.length > 0 &&
                        <div>
                            Topics: {conversationTopicTitles.map((topic, i) => (
                                <span key={i}>{i ? ', ' : ' '}{topic}</span>
                            ))}
                        </div>
                    }
                    {conversationReadTitles.length > 0 &&
                        <div>
                            Books: {conversationReadTitles.map((read, i) => (
                                <span key={i}>{i ? ', ' : ' '}{read}</span>
                            ))}
                        </div>
                    }
                    {conversationGoalTitles.length > 0 &&
                        <div>
                            Goals: {conversationGoalTitles.map((goal, i) => (
                                <span key={i}>{i ? ', ' : ' '}{goal}</span>
                            ))}
                        </div>
                    }
                    <a href={`/conversation/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}