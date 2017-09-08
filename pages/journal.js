import {Component} from 'react'
import Layout from '../components/layout'
import withPage from '../providers/page'
import {compose} from 'recompose'
import {withUser} from 'ooth-client-react'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import Markdown from '../components/markdown'
import {errorMessage} from '../utils/errors'
import ShyButton from '../components/shy-button'
import DeleteModal from '../components/delete-modal'
import gql from 'graphql-tag'
import {graphql} from 'react-apollo'
import CheckButtons from '../components/check-buttons'
import Panel from '../components/panel'

export default withPage(() => (
    <Layout title="Journal" page="journal">
        <Journal/>
    </Layout>
))

const JournalQuery = gql`
    query {
        me {
            local {
                username
            }
            entries {
                _id
                title
                url
                description
                goalTitles
            }
            goals {
                title
            }
        }
    }
`
const CreateEntryQuery = gql`
    mutation($entry: NewEntryInput!) {
        createEntry(entry: $entry) {
            _id
        }
    }
`
const UpdateEntryQuery = gql`
    mutation($entry: EntryInput!) {
        updateEntry(entry: $entry) {
            _id
        }
    }
`
const DeleteEntryQuery = gql`
    mutation($_id: ID!) {
        deleteEntry(_id: $_id) {
            _id
        }
    }
`
class JournalComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            journal: {loading, me, refetch},
            updateEntry,
            createEntry,
            deleteEntry,
        } = this.props

        const username = me && me.local && me.local.username
        const entries = (me && me.entries && me.entries.map(({
            _id,
            title,
            url,
            description,
            goalTitles,
        }) => ({
            _id,
            title,
            url,
            description,
            goalTitles,
        }))) || []
        const goalTitles = (me && me.goals && me.goals.map(goal => goal.title)) || []

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
            <h1>Journal</h1>
            <p>Here you can write regular updates about your <a href="/goals">goals</a>.</p>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && entries.length > 0 &&
                        <p>Your journal can be found at <a href={`/u/${username}/journal`}>/u/{username}/journal</a>.</p>
                    }
                    {this.state.new ?
                        <Panel title="New Entry"
                            onClose={() => {
                                this.setState({
                                    new: false
                                })
                            }}
                        >
                            <Form
                                onSubmit={() => {
                                    const goalTitles = Object.values(this.goals.checks).filter(g => g.checked).map(g => g.value)
                                    const entry = {
                                        title: this.title.value,
                                        url: this.url.value,
                                        description: this.description.value,
                                        goalTitles,
                                    }
                                    createEntry({
                                        variables: {
                                            entry,
                                        },
                                    }).then(() => {
                                        this.title.value = ''
                                        this.url.value = ''
                                        this.description.value = ''
                                        for (const check of Object.values(this.goals.checks)) {
                                            check.checked = false
                                        }
                                        this.setState({
                                            state: 'success',
                                            message: 'New journal entry created',
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
                                submitLabel="New Entry"
                            >
                                <div className="form-group">
                                    <label htmlFor="title">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="I cleaned my room!"
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
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        ref={ref => this.description = ref}
                                    />
                                </div>
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
                            New Journal Entry
                        </button>
                    }
                    {entries.length > 0 &&
                        <div>
                            <h2>Entries</h2>
                            {entries.map((entry) => (
                                <Entry
                                    key={entry._id}
                                    entry={entry}
                                    goalTitles={goalTitles}
                                    onUpdate={(entry) => {
                                        return updateEntry({
                                            variables: {
                                                entry,
                                            },
                                        }).then(refetch)
                                    }}
                                    onDelete={() => {
                                        return deleteEntry({
                                            variables: {
                                                _id: entry._id,
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
const Journal = compose(
    withLoginRequired('/journal'),
    graphql(JournalQuery, {
        name: 'journal'
    }),
    graphql(UpdateEntryQuery, {
        name: 'updateEntry',
    }),
    graphql(CreateEntryQuery, {
        name: 'createEntry',
    }),
    graphql(DeleteEntryQuery, {
        name: 'deleteEntry',
    }),
)(JournalComponent)

class Entry extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {entry: {_id, title, url, description, goalTitles: entryGoalTitles},
            goalTitles,
            onUpdate, onDelete} = this.props

        const goals = {}
        for (const title of goalTitles) {
            goals[title] = {
                label: title,
                default: entryGoalTitles.indexOf(title) > -1,
            }
        }
            

        return <div style={{
            marginBottom: '24px'
        }}>
            {this.state.edit ?
                <Panel title="Edit Entry"
                    onClose={() => {
                        this.setState({
                            edit: false
                        })
                    }}
                >
                    <Form
                        onSubmit={() => {
                            const goalTitles = Object.values(this.goals.checks).filter(g => g.checked).map(g => g.value)
                            const entry = {
                                _id,
                                title: this.title.value,
                                url: this.url.value,
                                description: this.description.value,
                                goalTitles,
                            }
                            onUpdate(entry)
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
                            <label htmlFor="description">Description</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                ref={ref => this.description = ref}
                                defaultValue={description}
                            />
                        </div>
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
                    marginTop: '24px',
                    marginBottom: '24px',
                }}>
                    <span style={{
                        display: 'block',
                        float: 'right'
                    }}>
                        <DeleteModal
                            title="Delete entry?"
                            message="A deleted journal entry can't be recovered."
                            onDelete={onDelete}/>
                        &nbsp;
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
                            <a href={url}>{title}</a>
                        :
                            title
                        }
                    </h3>
                    {description &&
                        <Markdown content={description}/>
                    }
                    {entryGoalTitles.length > 0 &&
                        <span>
                            Goals: {entryGoalTitles.map((goal, i) => (
                                <span key={i}>{i ? ',' : ''}&nbsp;{goal}</span>
                            ))}
                        </span>
                    }
                    <hr/>
                </div>
            }
        </div>
    }
}