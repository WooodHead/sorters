import {Component} from 'react'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'
import Button from 'react-bootstrap/lib/Button'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import RadioButtons from '../../components/radio-buttons'
import ShyButton from '../../components/shy-button'
import DeleteModal from '../../components/delete-modal'
import {errorMessage} from '../../utils/errors'
import AccountHeader from '../../components/account-header'

export default withPage(() => (
    <Layout title="Reading list" page="reads">
        <Reads/>
    </Layout>
))

const ReadsQuery = gql`
    query {
        me {
            local {
                username
            }
            reads {
                _id
                title
                reading
                read
            }
            profile {
                reading
            }
        }
    }
`
const UpdateReadsQuery = gql`
    mutation($readIds: [ID]!) {
        updateReads(readIds: $readIds) {
            _id
        }
    }
`
const CreateReadQuery = gql`
    mutation($read: NewReadInput!) {
        createRead(read: $read) {
            _id
        }
    }
`
const UpdateReadQuery = gql`
    mutation($read: ReadInput!) {
        updateRead(read: $read) {
            _id
        }
    }
`
const DeleteReadQuery = gql`
    mutation($_id: ID!) {
        deleteRead(_id: $_id) {
            _id
        }
    }
`
const UpdateReadingQuery = gql`
    mutation($reading: String) {
        updateReading(reading: $reading) {
            _id
        }
    }
`
class ReadsComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            reads: {loading, me, refetch},
            updateReads,
            createRead,
            updateRead,
            deleteRead,
            updateReading,
        } = this.props
        const username = me && me.local && me.local.username
        const {reading} = me && me.profile || {}
        const reads = (me && me.reads) || []

        return <div className="container">
            <AccountHeader route="reads"/>
            <h2>Reading List</h2>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && reads.length > 0 &&
                        <p>Your public reading list can be found at <a href={`/u/${username}/reads`}>/u/{username}/reads</a>.</p>
                    }
                    <div style={{
                        maxWidth: '400px',
                        margin: 'auto'
                    }}>
                        <h3>Description</h3>
                        <p>Here you can describe how you put together your reading list.</p>
                        <Form
                            onSubmit={() => {
                                const reading = this.reading.value
                                updateReading({
                                    variables: {
                                        reading
                                    }
                                }).then(() => {
                                    this.setState({
                                        readingState: 'success',
                                        readingMessage: 'Reading list description saved.'
                                    })
                                }).catch(e => {
                                    this.setState({
                                        readingState: 'error',
                                        readingMessage: errorMessage(e),
                                    })
                                })
                            }}
                            state={this.state.readingState}
                            message={this.state.readingMessage}
                            submitLabel="Save"
                        >
                            <div className="form-group">
                                <label htmlFor="reading">Description</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    ref={ref => this.reading = ref}
                                    defaultValue={reading}
                                />
                            </div>
                        </Form>
                        {reads.length > 0 &&
                            <div>
                                <h3>Your Reads</h3>
                                <ReadsList
                                    reads={reads}
                                    distance={1}
                                    onSortEnd={({oldIndex, newIndex}) => {
                                        const newReads = arrayMove(reads, oldIndex, newIndex)
                                        updateReads({
                                            variables: {
                                                readIds: newReads.map(({_id}) => _id),
                                            }
                                        }).then(() => {
                                            refetch();
                                        }).catch(e => {
                                            console.error(e)
                                        })
                                    }}
                                    updateRead={(read) => {
                                        return updateRead({
                                            variables: {
                                                read,
                                            },
                                        }).then(() => {
                                            refetch();
                                        })
                                    }}
                                    removeRead={(_id) => {
                                        return deleteRead({
                                            variables: {
                                                _id
                                            }
                                        }).then(() => {
                                            refetch();
                                        }).catch(e => {
                                            console.error(e)
                                        })
                                    }}
                                />
                            </div>
                        }
                        <h4>New Book</h4>
                        <Form
                            onSubmit={() => {
                                const read = {
                                    title: this.title.value
                                }
                                createRead({
                                    variables: {
                                        read
                                    }
                                }).then(() => {
                                    this.title.value = ''
                                    this.setState({
                                        state: 'success',
                                        message: 'Reads updated!'
                                    }, refetch)
                                }).catch(e => {
                                    this.setState({
                                        state: 'error',
                                        message: errorMessage(e),
                                    })
                                })
                            }}
                            state={this.state.state}
                            message={this.state.message}
                            submitLabel="New Book"
                        >
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={reads.length === 0 ? 'Jordan Peterson - Maps of Meaning' : ''}
                                    ref={ref => {
                                        this.title = ref
                                    }}
                                    required
                                />
                            </div>
                        </Form>
                    </div>
                </div>
            }
        </div>
    }
}
const Reads = compose(
    withLoginRequired('/account/reads'),
    graphql(ReadsQuery, {
        name: 'reads'
    }),
    graphql(UpdateReadsQuery, {
        name: 'updateReads'
    }),
    graphql(CreateReadQuery, {
        name: 'createRead'
    }),
    graphql(UpdateReadQuery, {
        name: 'updateRead'
    }),
    graphql(DeleteReadQuery, {
        name: 'deleteRead'
    }),
    graphql(UpdateReadingQuery, {
        name: 'updateReading'
    }),
)(ReadsComponent)

const ReadsListComponent = ({reads, updateRead, removeRead}) => (
    <ul>
        {reads.map((read, i) => (
            <Read
                key={read._id}
                index={i}
                read={read}
                update={read => updateRead(read)}
                remove={() => removeRead(read._id)}
            />
        ))}
    </ul>
)
const ReadsList = compose(
    SortableContainer
)(ReadsListComponent)

class ReadComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {read: {_id, title, reading, read}, update, remove} = this.props
        const readingStatus = read ? 'read' : (reading ? 'reading' : 'not')
        return <li style={{
            cursor: 'pointer',
            clear: 'both'
        }}>
            {this.state.edit ?
                <Form
                    onSubmit={() => {
                        let readingStatus = ['read', 'reading', 'not'].find(value => this.readingStatus.radios[value].checked) || 'not'
                        const read = {
                            _id,
                            title: this.title.value,
                            reading: readingStatus === 'reading',
                            read: readingStatus === 'read',
                        }
                        update(read)
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
                    submitLabel="Save"
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
                        <label htmlFor='title'>Title</label>
                        <input
                            id="title"
                            type="text"
                            className="form-control"
                            defaultValue={title}
                            ref={ref => {
                                this.title = ref
                            }}
                        />
                    </div>
                    <RadioButtons
                        ref={ref => {
                            this.readingStatus = ref
                        }}
                        id="reading-status"
                        label="Reading status"
                        defaultValue={readingStatus}
                        values={{
                            not: {
                                label: 'Not reading',
                            },
                            reading: {
                                label: 'Reading',
                            },
                            read: {
                                label: 'Read',
                            },
                        }}
                    />
                </Form>
            :
                <span>
                    <span style={{
                        display: 'block',
                        float: 'right'
                    }}>
                        <DeleteModal
                            title="Delete book?"
                            message="A deleted book can't be recovered."
                            onDelete={remove}/>
                        {' '}
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <span>{title}</span>
                    {readingStatus === 'read' && <span> ✔</span>}
                    {readingStatus === 'reading' && <span> 👁</span>}
                </span>
            }
        </li>
    }    
}
const Read = compose(
    SortableElement
)(ReadComponent)
