import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import Author from '../components/author'

export default withPage(({url: {query: {speechId}}}) => (
    <Speech speechId={speechId}/>
))

const SpeechQuery = gql`
    query($speechId: ID!) {
        speech(_id: $speechId) {
            _id
            user {
                emailHash
                profile {
                    name
                }
                local {
                    username
                }
            }
            title
            url
            content
            topicTitles
            readTitles
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
const SpeechComponent = (props) => {
    const {data: {loading, speech, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading speech" page="user">
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

    if (!speech) {
        return <Layout title="Invalid speech" page="user">
            <div className="container">
                <p>Invalid speech.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, content, readTitles, topicTitles, comments, user} = speech

    return <Layout title={title} page="user">
        <div className="container">
            <h1>
                {url ?
                    <a href={url}>{title}</a>
                :
                    title
                }
            </h1>
            <Author user={user}/>
            {content &&
                <Markdown content={content}/>
            }
            {readTitles.length > 0 &&
                <div>
                    Books: {readTitles.map((read, i) => (
                        <span key={i}>{i ? ', ' : ' '}<em>{read}</em></span>
                    ))}
                </div>
            }
            {topicTitles.length > 0 &&
                <div>
                    Topics: {topicTitles.map((topic, i) => (
                        <span key={i}>{i ? ', ' : ' '}<em>{topic}</em></span>
                    ))}
                </div>
            }
            <Comments comments={comments} entityType="speech" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Speech = compose(
    graphql(SpeechQuery, {
        options: ({speechId}) => ({
            variables: {
                speechId
            }
        })
    })
)(SpeechComponent)