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
                topicTitles
                readTitles
            }
            topics {
                title
            }
            reads {
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
        const speeches = (me && me.speeches && me.speeches.map(({
            _id,
            title,
            url,
            content,
            readTitles,
            topicTitles,
        }) => ({
            _id,
            title,
            url,
            content,
            topicTitles,
            readTitles,
        }))) || []
        const topicTitles = (me && me.topics && me.topics.map(topic => topic.title)) || []
        const readTitles = (me && me.reads && me.reads.map(read => read.title)) || []
        
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

        return <div style={{
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <h1>Speeches</h1>
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
                                    const topicTitles = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                                    const readTitles = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                                    const speech = {
                                        title: this.title.value,
                                        url: this.url.value,
                                        content: this.content.value,
                                        topicTitles,
                                        readTitles,
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
                            <h2>Speeches</h2>
                            {speeches.map((speech) => (
                                <Speech
                                    key={speech._id}
                                    speech={speech}
                                    topicTitles={topicTitles}
                                    readTitles={readTitles}
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
                topicTitles: speechTopicTitles,
                readTitles: speechReadTitles,
            },
            topicTitles,
            readTitles,
            onUpdate,
            onDelete
        } = this.props

        const topics = {}
        for (const title of topicTitles) {
            topics[title] = {
                label: title,
                default: speechTopicTitles.indexOf(title) > -1,
            }
        }
        const reads = {}
        for (const title of readTitles) {
            reads[title] = {
                label: title,
                default: speechReadTitles.indexOf(title) > -1,
            }
        }
            

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
                            const topicTitles = Object.values(this.topics.checks).filter(t => t.checked).map(t => t.value)
                            const readTitles = Object.values(this.reads.checks).filter(r => r.checked).map(r => r.value)
                            const speech = {
                                _id,
                                title: this.title.value,
                                url: this.url.value,
                                content: this.content.value,
                                topicTitles,
                                readTitles,
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
                    <h3>
                        {url ?
                            <a href={url} target="_blank">{title}</a>
                        :
                            title
                        }
                    </h3>
                    {content &&
                        <Markdown content={content}/>
                    }
                    {speechTopicTitles.length > 0 &&
                        <div>
                            Topics: {speechTopicTitles.map((topic, i) => (
                                <span key={i}>{i ? ', ' : ' '}{topic}</span>
                            ))}
                        </div>
                    }
                    {speechReadTitles.length > 0 &&
                        <div>
                            Books: {speechReadTitles.map((read, i) => (
                                <span key={i}>{i ? ', ' : ' '}{read}</span>
                            ))}
                        </div>
                    }
                    <a href={`/speech/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}