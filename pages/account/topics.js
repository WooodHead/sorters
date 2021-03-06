import {Component} from 'react'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import Markdown from '../../components/markdown'
import RadioButtons from '../../components/radio-buttons'
import ShyButton from '../../components/shy-button'
import DeleteModal from '../../components/delete-modal'
import {errorMessage} from '../../utils/errors'
import AccountHeader from '../../components/account-header'

export default withPage(() => (
    <Layout title="Topics" page="topics">
        <Topics/>
    </Layout>
))

const TopicsQuery = gql`
    query {
        me {
            local {
                username
            }
            topics {
                _id
                title
                description
            }
            profile {
                topics
            }
        }
    }
`
const UpdateTopicsQuery = gql`
    mutation($topicIds: [ID]!) {
        updateTopics(topicIds: $topicIds) {
            _id
        }
    }
`
const CreateTopicQuery = gql`
    mutation($topic: NewTopicInput!) {
        createTopic(topic: $topic) {
            _id
        }
    }
`
const UpdateTopicQuery = gql`
mutation($topic: TopicInput!) {
    updateTopic(topic: $topic) {
        _id
    }
}
`
const DeleteTopicQuery = gql`
mutation($_id: ID!) {
    deleteTopic(_id: $_id) {
        _id
    }
}
`
const UpdateTopicsDescriptionQuery = gql`
    mutation($topics: String) {
        updateTopicsDescription(topics: $topics) {
            _id
        }
    }
`
class TopicsComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            topics: {loading, me, refetch},
            updateTopics,
            createTopic,
            updateTopic,
            deleteTopic,
            updateTopicsDescription,
        } = this.props
        const username = me && me.local && me.local.username
        const {topics: topicsDescription} = (me && me.profile) || {}
        const topics = (me && me.topics) || []

        return <div className="container">
            <AccountHeader route="topics"/>
            <h2>Topics</h2>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username && topics.length > 0 &&
                        <p>Your public topics list can be found at <a href={`/u/${username}/topics`}>/u/{username}/topics</a>.</p>
                    }
                    <div style={{
                        maxWidth: '400px',
                        margin: 'auto'
                    }}>
                        <h3>Description</h3>
                        <p>Here you can provide a general description of your interests.</p>
                        <Form
                            onSubmit={() => {
                                const topicsDescription = this.topicsDescription.value
                                updateTopicsDescription({
                                    variables: {
                                        topics: topicsDescription
                                    }
                                }).then(() => {
                                    this.setState({
                                        topicsDescriptionState: 'success',
                                        topicsDescriptionMessage: 'Topics description saved.'
                                    })
                                }).catch(e => {
                                    this.setState({
                                        topicsDescriptionState: 'error',
                                        topicsDescriptionMessage: errorMessage(e)
                                    })
                                })
                            }}
                            state={this.state.topicsDescriptionState}
                            message={this.state.topicsDescriptionMessage}
                            submitLabel="Save"
                        >
                            <div className="form-group">
                                <label htmlFor="topics-description">Description</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    ref={ref => this.topicsDescription = ref}
                                    defaultValue={topicsDescription}
                                />
                            </div>
                        </Form>
                        {topics.length > 0 &&
                            <div>
                                <h3>Your Topics</h3>
                                <TopicsList
                                    topics={topics}
                                    distance={1}
                                    onSortEnd={({oldIndex, newIndex}) => {
                                        const newTopics = arrayMove(topics, oldIndex, newIndex)
                                        updateTopics({
                                            variables: {
                                                topics: newTopics
                                            }
                                        }).then(() => {
                                            refetch();
                                        }).catch(e => {
                                            console.error(e)
                                        })
                                    }}
                                    updateTopic={(topic) => {
                                        return updateTopic({
                                            variables: {
                                                topic,
                                            }
                                        }).then(() => {
                                            refetch();
                                        })
                                    }}
                                    deleteTopic={(_id) => {
                                        return deleteTopic({
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
                        <h4>New Topic</h4>
                        <Form
                            onSubmit={() => {
                                const topic = {
                                    title: this.title.value
                                }
                                createTopic({
                                    variables: {
                                        topic
                                    }
                                }).then(() => {
                                    this.title.value = ''
                                    this.setState({
                                        state: 'success',
                                        message: 'Topics updated!'
                                    }, refetch)
                                }).catch(e => {
                                    this.setState({
                                        state: 'error',
                                        message: errorMessage(e)
                                    })
                                })
                            }}
                            state={this.state.state}
                            message={this.state.message}
                            submitLabel="New Topic"
                        >
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={topics.length === 0 ? 'Jungian archetypes' : ''}
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
const Topics = compose(
    withLoginRequired('/account/topics'),
    graphql(TopicsQuery, {
        name: 'topics'
    }),
    graphql(UpdateTopicsQuery, {
        name: 'updateTopics'
    }),
    graphql(CreateTopicQuery, {
        name: 'createTopic'
    }),
    graphql(UpdateTopicQuery, {
        name: 'updateTopic'
    }),
    graphql(DeleteTopicQuery, {
        name: 'deleteTopic'
    }),
    graphql(UpdateTopicsDescriptionQuery, {
        name: 'updateTopicsDescription'
    })
)(TopicsComponent)

const TopicsListComponent = ({topics, updateTopic, deleteTopic}) => (
    <ul>
        {topics.map((topic, i) => (
            <Topic
                key={topic._id}
                index={i}
                topic={topic}
                update={topic => updateTopic(topic)}
                deleteTopic={() => deleteTopic(topic._id)}
            />
        ))}
    </ul>
)
const TopicsList = compose(
    SortableContainer
)(TopicsListComponent)

class TopicComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {topic: {_id, title, description}, update, deleteTopic} = this.props
        return <li style={{
            cursor: 'pointer',
            clear: 'both',
        }}>
            {this.state.edit ?
                <Form
                    onSubmit={() => {
                        const topic = {
                            _id,
                            title: this.title.value,
                        }
                        update(topic)
                            .then(() => {
                                this.setState({
                                    edit: false
                                })
                            }).catch(e => {
                                this.setState({
                                    state: 'error',
                                    message: errorMessage(e)
                                })
                            })
                    }}
                    submitLabel="Save"
                >
                    <span
                        style={{
                            display: 'block',
                            float: 'right'
                        }}
                    >
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: false
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
                            title="Delete topic?"
                            message="A deleted topic can't be recovered."
                            onDelete={deleteTopic}
                        />&nbsp;
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <a href={`/topic/${_id}`}>{title}</a>
                </span>
            }
        </li>
    }
}
const Topic = compose(
    SortableElement
)(TopicComponent)
