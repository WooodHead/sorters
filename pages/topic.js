import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import Author from '../components/author'
import UserHeader from '../components/user-header'
import Related from '../components/related-entities'

export default withPage(({url: {query: {topicId}}}) => (
    <Topic topicId={topicId}/>
))

const TopicQuery = gql`
    query($topicId: ID!) {
        topic(_id: $topicId) {
            _id
            user {
                emailHash
                profile {
                    name
                    about
                }
                local {
                    username
                }
            }
            title
            essays {
                _id
                title
            }
            speeches {
                _id
                title
            }
            conversations {
                _id
                title
            }
            comments {
                _id
                user {
                    _id
                    emailHash
                    profile {
                        name
                    }
                    local {
                        username
                    }
                }
                content
                deleted
            }
        }
    }
`
const TopicComponent = (props) => {
    const {data: {loading, topic, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading topic" page="user">
            <div className="container">
                <p>Loading...</p>
            </div>
        </Layout>
    }

    if (error) {
        return <Layout title="Error" page="user">
            <div className="container">
                <p>Error.</p>
            </div>
        </Layout>
    }

    if (!topic) {
        return <Layout title="Invalid topic" page="user">
            <div className="container">
                <p>Invalid topic.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, description, essays, speeches, conversations, comments, user} = topic
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash

    return <Layout title={title} page="user">
        <div className="container">
            <UserHeader id={user._id} name={name} username={username} emailHash={emailHash} about={about} route="topics" />
            <h1>
                {title}
            </h1>
            {description &&
                <Markdown content={description}/>
            }
            <Related entities={essays} label="Essays:" type="essay"/>
            <Related entities={speeches} label="Speeches:" type="speech"/>
            <Related entities={conversations} label="Conversations:" type="conversation"/>
            <Comments comments={comments} entityType="topic" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Topic = compose(
    graphql(TopicQuery, {
        options: ({topicId}) => ({
            variables: {
                topicId
            }
        })
    })
)(TopicComponent)