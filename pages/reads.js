import {Component} from 'react'
import Layout from '../components/layout'
import withPage from '../providers/page'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'
import Button from 'react-bootstrap/lib/Button'
import RadioButtons from '../components/radio-buttons'
import ShyButton from '../components/shy-button'
import DeleteModal from '../components/delete-modal'
import {errorMessage} from '../utils/errors'

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
                title
                reading
                read
                articleUrl
                videoUrl
            }
            profile {
                reading
            }
        }
    }
`
const UpdateReadsQuery = gql`
    mutation($reads: [ReadInput]!) {
        updateReads(reads: $reads) {
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
            updateReading,
        } = this.props
        const username = me && me.local && me.local.username
        const {reading} = (me && me.profile) || {}
        const reads = (me && me.reads && me.reads.map(({
                title,
                reading,
                read,
                articleUrl,
                videoUrl,
            }) => ({
                title,
                reading,
                read,
                articleUrl,
                videoUrl,
            }))) || []

        return <div style={{
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <h1>Reading List</h1>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && reads.length > 0 &&
                        <p>Your public reading list can be found at <a href={`/u/${username}`}>/u/{username}</a>.</p>
                    }
                    <h2>Description</h2>
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
                            <h2>Your Reads</h2>
                            <ReadsList
                                reads={reads}
                                distance={1}
                                onSortEnd={({oldIndex, newIndex}) => {
                                    const newReads = arrayMove(reads, oldIndex, newIndex)
                                    updateReads({
                                        variables: {
                                            reads: newReads
                                        }
                                    }).then(() => {
                                        refetch();
                                    }).catch(e => {
                                        console.error(e)
                                    })
                                }}
                                updateRead={(key, read) => {
                                    reads[key] = read;
                                    return updateReads({
                                        variables: {
                                            reads
                                        }
                                    }).then(() => {
                                        refetch();
                                    })
                                }}
                                removeRead={(key) => {
                                    reads.splice(key, 1)
                                    return updateReads({
                                        variables: {
                                            reads
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
                    <h3>New Book</h3>
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
            }
        </div>
    }
}
const Reads = compose(
    withLoginRequired('/reads'),
    graphql(ReadsQuery, {
        name: 'reads'
    }),
    graphql(UpdateReadsQuery, {
        name: 'updateReads'
    }),
    graphql(CreateReadQuery, {
        name: 'createRead'
    }),
    graphql(UpdateReadingQuery, {
        name: 'updateReading'
    }),
)(ReadsComponent)

const ReadsListComponent = ({reads, updateRead, removeRead}) => (
    <ul>
        {reads.map((read, key) => (
            <Read
                key={key}
                index={key}
                read={read}
                update={read => updateRead(key, read)}
                remove={() => removeRead(key)}
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
        const {read: {title, reading, read, articleUrl, videoUrl}, update, remove} = this.props
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
                            title: this.title.value,
                            reading: readingStatus === 'reading',
                            read: readingStatus === 'read',
                            articleUrl: this.articleUrl.value,
                            videoUrl: this.videoUrl.value,
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
                        >✕</ShyButton>&nbsp;
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
                            readOnly
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
                    <div className="form-group">
                        <label htmlFor="article-url">Article URL</label>
                        <input
                            id="article-url"
                            type="text"
                            className="form-control"
                            defaultValue={articleUrl}
                            ref={ref => {
                                this.articleUrl = ref
                            }}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor='video-url'>Video URL</label>
                        <input
                            id="video-url"
                            type="text"
                            className="form-control"
                            defaultValue={videoUrl}
                            ref={ref => {
                                this.videoUrl = ref
                            }}
                        />
                    </div>
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
                        &nbsp;
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <span>{title}</span>
                    {readingStatus === 'read' && <span>&nbsp;✔</span>}
                    {readingStatus === 'reading' && <span>&nbsp;👁</span>}
                    {(articleUrl || videoUrl) && <span>&nbsp;(
                        {articleUrl && <a href={articleUrl}>article</a>}
                        {articleUrl && videoUrl && <span>,&nbsp;</span>}
                        {videoUrl && <a href={videoUrl}>video</a>}
                    )</span>}
                </span>
            }
        </li>
    }    
}
const Read = compose(
    SortableElement
)(ReadComponent)
