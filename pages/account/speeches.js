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
    <Layout title="Speeches" page="speeches">
        <Speeches/>
    </Layout>
))

const SpeechesQuery = gql`
    query {
        me {
            local {
                username
            }
            speeches {
                _id
                title
                url
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
            }
            topics {
                _id
                title
            }
            reads {
                _id
                title
            }
        }
    }
`
const CreateSpeechQuery = gql`
    mutation($speech: NewSpeechInput!) {
        createSpeech(speech: $speech) {
            _id
        }
    }
`
const UpdateSpeechQuery = gql`
    mutation($speech: SpeechInput!) {
        updateSpeech(speech: $speech) {
            _id
        }
    }
`
const DeleteSpeechQuery = gql`
    mutation($_id: ID!) {
        deleteSpeech(_id: $_id) {
            _id
        }
    }
`
class SpeechesComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }

    render() {
        const {
            speeches: {loading, me, refetch},
            updateSpeech,
            createSpeech,
            deleteSpeech,
        } = this.props

        const username = me && me.local && me.local.username
        const speeches = (me && me.speeches) || []

        return <div className="container">
            <AccountHeader route="speeches"/>
            <h2>Speeches</h2>
            <p>Here you can share your speeches about the <a href="/account/topics">topics</a> you are interested in or about the <a href="/account/reads">books</a> you read.</p>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && speeches.length > 0 &&
                        <p>Your speeches can be found at <a href={`/u/${username}/speeches`}>/u/{username}/speeches</a>.</p>
                    }
                    {this.state.new ?
                        <Panel title="New Speech"
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
                                    const speech = {
                                        title: this.title.value,
                                        url: this.url.value,
                                        content: this.content.value,
                                        topicIds,
                                        readIds,
                                    }
                                    createSpeech({
                                        variables: {
                                            speech,
                                        },
                                    }).then(() => {
                                        this.title.value = ''
                                        this.url.value = ''
                                        this.content.value = ''
                                        for (const check of Object.values(this.topics.checks)) {
                                            check.checked = false
                                        }
                                        for (const check of Object.values(this.reads.checks)) {
                                            check.checked = false
                                        }
                                        this.setState({
                                            state: 'success',
                                            message: 'New speech created',
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
                                submitLabel="New Speech"
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
                                    <label htmlFor="url">URL</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Optional URL to external article"
                                        ref={ref => {
                                            this.url = ref
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="content">Speech</label>
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
                            </Form>
                        </Panel>
                    :
                        <button
                            className="btn btn-primary"
                            onClick={() => this.setState({new: true})}>
                            New Speech
                        </button>
                    }
                    {speeches.length > 0 &&
                        <div>
                            <h3>Speeches</h3>
                            {speeches.map((speech) => (
                                <Speech
                                    key={speech._id}
                                    speech={speech}
                                    topics={me.topics}
                                    reads={me.reads}
                                    onUpdate={(speech) => {
                                        return updateSpeech({
                                            variables: {
                                                speech,
                                            },
                                        }).then(refetch)
                                    }}
                                    onDelete={() => {
                                        return deleteSpeech({
                                            variables: {
                                                _id: speech._id,
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
const Speeches = compose(
    withLoginRequired('/account/speeches'),
    graphql(SpeechesQuery, {
        name: 'speeches'
    }),
    graphql(UpdateSpeechQuery, {
        name: 'updateSpeech',
    }),
    graphql(CreateSpeechQuery, {
        name: 'createSpeech',
    }),
    graphql(UpdateSpeechQuery, {
        name: 'updateSpeech',
    }),
    graphql(DeleteSpeechQuery, {
        name: 'deleteSpeech',
    }),
)(SpeechesComponent)

class Speech extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            speech: {
                _id,
                title,
                url,
                content,
                topicIds,
                topics: speechTopics,
                readIds,
                reads: speechReads,
            },
            topics,
            reads,
            onUpdate,
            onDelete
        } = this.props

        return <div style={{
            marginBottom: '1.5rem'
        }}>
            {this.state.edit ?
                <Panel title="Edit Speech"
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
                            const speech = {
                                _id,
                                title: this.title.value,
                                url: this.url.value,
                                content: this.content.value,
                                topicIds,
                                readIds,
                            }
                            onUpdate(speech)
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
                            <label htmlFor="url">URL</label>
                            <input
                                type="text"
                                className="form-control"
                                ref={ref => {
                                    this.url = ref
                                }}
                                defaultValue={url}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="content">Speech</label>
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
                            title="Delete speech?"
                            message="A deleted speech can't be recovered."
                            onDelete={onDelete}/>
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <h4>
                        {url ?
                            <a href={url} target="_blank">{title}</a>
                        :
                            <a href={`/speech/${_id}`}>{title}</a>
                        }
                    </h4>
                    {content &&
                        <Markdown content={content}/>
                    }
                    <Related entities={speechTopics} label="Topics:" type="topic"/>
                    <Related entities={speechReads} label="Books:" type="read"/>
                    <a href={`/speech/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}
