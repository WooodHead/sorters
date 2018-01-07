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
                    about
                }
                local {
                    username
                }
            }
            title
            url
            content
            topics {
                _id
                title
            }
            reads {
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

    const {_id, title, url, content, reads, topics, comments, user} = speech
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash

    return <Layout title={title} page="user">
        <div className="container">
            <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="speeches" />
            <h1>
                {url ?
                    <a href={url} target="_blank">{title}</a>
                :
                    title
                }
            </h1>
            {content &&
                <Markdown content={content}/>
            }
            <Related entities={topics} label="Topics:" type="topic"/>
            <Related entities={reads} label="Books:" type="read"/>
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