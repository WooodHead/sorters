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
    <Layout title="Essays" page="essays">
        <Essays/>
    </Layout>
))

const EssaysQuery = gql`
    query {
        me {
            local {
                username
            }
            essays {
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
const CreateEssayQuery = gql`
    mutation($essay: NewEssayInput!) {
        createEssay(essay: $essay) {
            _id
        }
    }
`
const UpdateEssayQuery = gql`
    mutation($essay: EssayInput!) {
        updateEssay(essay: $essay) {
            _id
        }
    }
`
const DeleteEssayQuery = gql`
    mutation($_id: ID!) {
        deleteEssay(_id: $_id) {
            _id
        }
    }
`
class EssaysComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            essays: {loading, me, refetch},
            updateEssay,
            createEssay,
            deleteEssay,
        } = this.props

        const username = me && me.local && me.local.username
        const essays = (me && me.essays && me.essays.map(({
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
            <h1>Essays</h1>
            <p>Here you can write essays about the <a href="/account/topics">topics</a> you are interested in or about the <a href="/account/reads">books</a> you read.</p>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && essays.length > 0 &&
                        <p>Your essays can be found at <a href={`/u/${username}/essays`}>/u/{username}/essays</a>.</p>
                    }
                    {this.state.new ?
                        <Panel title="New Essay"
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
                                    const essay = {
                                        title: this.title.value,
                                        url: this.url.value,
                                        content: this.content.value,
                                        topicTitles,
                                        readTitles,
                                    }
                                    createEssay({
                                        variables: {
                                            essay,
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
                                            message: 'New essay created',
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
                                submitLabel="New Essay"
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
                                    <label htmlFor="content">Essay</label>
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
                            New Essay
                        </button>
                    }
                    {essays.length > 0 &&
                        <div>
                            <h2>Essays</h2>
                            {essays.map((essay) => (
                                <Essay
                                    key={essay._id}
                                    essay={essay}
                                    topicTitles={topicTitles}
                                    readTitles={readTitles}
                                    onUpdate={(essay) => {
                                        return updateEssay({
                                            variables: {
                                                essay,
                                            },
                                        }).then(refetch)
                                    }}
                                    onDelete={() => {
                                        return deleteEssay({
                                            variables: {
                                                _id: essay._id,
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
const Essays = compose(
    withLoginRequired('/account/essays'),
    graphql(EssaysQuery, {
        name: 'essays'
    }),
    graphql(UpdateEssayQuery, {
        name: 'updateEssay',
    }),
    graphql(CreateEssayQuery, {
        name: 'createEssay',
    }),
    graphql(DeleteEssayQuery, {
        name: 'deleteEssay',
    }),
)(EssaysComponent)

class Essay extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            essay: {
                _id,
                title,
                url,
                content,
                topicTitles: essayTopicTitles,
                readTitles: essayReadTitles,
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
                default: essayTopicTitles.indexOf(title) > -1,
            }
        }
        const reads = {}
        for (const title of readTitles) {
            reads[title] = {
                label: title,
                default: essayReadTitles.indexOf(title) > -1,
            }
        }
            

        return <div style={{
            marginBottom: '1.5rem'
        }}>
            {this.state.edit ?
                <Panel title="Edit Essay"
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
                            const essay = {
                                _id,
                                title: this.title.value,
                                url: this.url.value,
                                content: this.content.value,
                                topicTitles,
                                readTitles,
                            }
                            onUpdate(essay)
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
                            <label htmlFor="content">Essay</label>
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
                            title="Delete essay?"
                            message="A deleted essay can't be recovered."
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
                    {essayTopicTitles.length > 0 &&
                        <div>
                            Topics: {essayTopicTitles.map((topic, i) => (
                                <span key={i}>{i ? ', ' : ' '}{topic}</span>
                            ))}
                        </div>
                    }
                    {essayReadTitles.length > 0 &&
                        <div>
                            Books: {essayReadTitles.map((read, i) => (
                                <span key={i}>{i ? ', ' : ' '}{read}</span>
                            ))}
                        </div>
                    }
                    <a href={`/essay/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}