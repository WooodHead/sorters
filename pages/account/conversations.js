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
import EntityCheckButtons from '../../components/entity-check-buttons'
import Panel from '../../components/panel'
import AccountHeader from '../../components/account-header'
import Related from '../../components/related-entities'

export default withPage(() => (
    <Layout title="Conversations" page="conversations">
        <Conversations/>
    </Layout>
))

const ConversationsQuery = gql`
    query {
        me {
            local {
                username
            }
            conversations {
                _id
                title
                content
                topicIds
                topics {
                    _id
                    title
                }
                readIds
                reads {
                    _id
                    title
                }
                goalIds
                goals {
                    _id
                    title
                }
            }
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
class ConversationsComponent extends Component {
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
        const conversations = (me && me.conversations) || []
        
        return <div className="container">
            <AccountHeader route="conversations"/>
            <h2>Conversations</h2>
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
                                    const topicIds = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                                    const readIds = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                                    const goalIds = Object.values(this.goals.checks).filter(r => r.checked).map(r => r.value)
                                    const conversation = {
                                        title: this.title.value,
                                        content: this.content.value,
                                        topicIds,
                                        readIds,
                                        goalIds,
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
                                <EntityCheckButtons
                                    label="Topics"
                                    id="topics"
                                    entities={me.topics}
                                    checksRef={ref => this.topics = ref}
                                />
                                <EntityCheckButtons
                                    label="Books"
                                    id="reads"
                                    entities={me.reads}
                                    checksRef={ref => this.reads = ref}
                                />
                                <EntityCheckButtons
                                    label="Goals"
                                    id="goals"
                                    entities={me.goals}
                                    checksRef={ref => this.goals = ref}
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
                            <h3>Conversations</h3>
                            {conversations.map((conversation) => (
                                <Conversation
                                    key={conversation._id}
                                    conversation={conversation}
                                    topics={me.topics}
                                    reads={me.reads}
                                    goals={me.goals}
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
    graphql(ConversationsQuery, {
        name: 'conversations'
    }),
    graphql(UpdateConversationQuery, {
        name: 'updateConversation',
    }),
    graphql(CreateConversationQuery, {
        name: 'createConversation',
    }),
    graphql(UpdateConversationQuery, {
        name: 'updateConversation',
    }),
    graphql(DeleteConversationQuery, {
        name: 'deleteConversation',
    }),
)(ConversationsComponent)

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
                topicIds,
                topics: conversationTopics,
                readIds,
                reads: conversationReads,
                goalIds,
                goals: conversationGoals,
            },
            topics,
            reads,
            goals,
            onUpdate,
            onDelete
        } = this.props

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
                            const topicIds = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                            const readIds = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                            const goalIds = Object.values(this.goals.checks).filter(r => r.checked).map(r => r.value)
                            const conversation = {
                                _id,
                                title: this.title.value,
                                content: this.content.value,
                                topicIds,
                                readIds,
                                goalIds,
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
                        <EntityCheckButtons
                            label="Topics"
                            id="topics"
                            entities={topics}
                            defaultEntityIds={topicIds}
                            checksRef={ref => this.topics = ref}
                        />
                        <EntityCheckButtons
                            label="Reads"
                            id="reads"
                            entities={reads}
                            defaultEntityIds={readIds}
                            checksRef={ref => this.reads = ref}
                        />
                        <EntityCheckButtons
                            label="Goals"
                            id="goals"
                            entities={goals}
                            defaultEntityIds={goalIds}
                            checksRef={ref => this.goals = ref}
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
                    <h4><a href={`/conversation/${_id}`}>{title}</a></h4>
                    {content &&
                        <Markdown content={content}/>
                    }
                    <Related entities={conversationTopics} label="Topics:" type="topic"/>
                    <Related entities={conversationReads} label="Books:" type="read"/>
                    <Related entities={conversationGoals} label="Goals:" type="goal"/>
                    <a href={`/conversation/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}