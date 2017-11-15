import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import Author from '../components/author'

export default withPage(({url: {query: {essayId}}}) => (
    <Essay essayId={essayId}/>
))

const EssayQuery = gql`
    query($essayId: ID!) {
        essay(_id: $essayId) {
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
const EssayComponent = (props) => {
    const {data: {loading, essay, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading essay" page="user">
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

    if (!essay) {
        return <Layout title="Invalid essay" page="user">
            <div className="container">
                <p>Invalid essay.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, content, readTitles, topicTitles, comments, user} = essay

    return <Layout title={title} page="user">
        <div className="container">
            <h1>
                {url ?
                    <a href={url} target="_blank">{title}</a>
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
            <Comments comments={comments} entityType="essay" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Essay = compose(
    graphql(EssayQuery, {
        options: ({essayId}) => ({
            variables: {
                essayId
            }
        })
    })
)(EssayComponent)