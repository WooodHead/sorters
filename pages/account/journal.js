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
                goalIds
                goals {
                    _id
                    title
                }
            }
            goals {
                _id
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
        const entries = (me && me.entries) || []

        return <div className="container">
            <AccountHeader route="journal"/>
            <h2>Journal</h2>
            <p>Here you can write regular updates about your <a href="/account/goals">goals</a>.</p>
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
                                    const goalIds = Object.values(this.goals.checks).filter(g => g.checked).map(g => g.value)
                                    const entry = {
                                        title: this.title.value,
                                        url: this.url.value,
                                        description: this.description.value,
                                        goalIds,
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
                            New Journal Entry
                        </button>
                    }
                    {entries.length > 0 &&
                        <div>
                            <h3>Entries</h3>
                            {entries.map((entry) => (
                                <Entry
                                    key={entry._id}
                                    entry={entry}
                                    goals={me.goals}
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
    withLoginRequired('/account/journal'),
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
        const {
            entry: {
                _id,
                title, 
                url, 
                description, 
                goalIds,
                goals: entryGoals,
            },
            goals,
            onUpdate,
            onDelete
        } = this.props

        return <div style={{
            marginBottom: '1.5rem'
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
                            const goalIds = Object.values(this.goals.checks).filter(g => g.checked).map(g => g.value)
                            const entry = {
                                _id,
                                title: this.title.value,
                                url: this.url.value,
                                description: this.description.value,
                                goalIds,
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
                            title="Delete entry?"
                            message="A deleted journal entry can't be recovered."
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
                            title
                        }
                    </h4>
                    {description &&
                        <Markdown content={description}/>
                    }
                    <Related entities={entryGoals} label="Goals:" type="goal"/>
                    <a href={`/entry/${_id}`}>Comments</a>
                    <hr/>
                </div>
            }
        </div>
    }
}
