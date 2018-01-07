import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
import UserHeader from '../components/user-header'
import Author from '../components/author'

export default withPage(({url: {query: {entryId}}}) => (
    <Entry entryId={entryId}/>
))

const EntryQuery = gql`
    query($entryId: ID!) {
        entry(_id: $entryId) {
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
            description
            goals {
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
const EntryComponent = (props) => {
    const {data: {loading, entry, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading entry" page="user">
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

    if (!entry) {
        return <Layout title="Invalid entry" page="user">
            <div className="container">
                <p>Invalid journal entry.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, description, goals, comments,user} = entry
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash

    return <Layout title={title} page="user">
        <div className="container">
            <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="journal" />
            <h1>
                {url ?
                    <a href={url} target="_blank">{title}</a>
                :
                    title
                }
            </h1>
            {description &&
                <Markdown content={description}/>
            }
            {goals.length > 0 &&
                <div>
                    Goals: {goals.map(({_id, title}, i) => (
                        <span key={i}>{i ? ', ' : ' '}<a href={`/goal/${_id}`}>{title}</a></span>
                    ))}
                </div>
            }
            <Comments comments={comments} entityType="entry" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Entry = compose(
    graphql(EntryQuery, {
        options: ({entryId}) => ({
            variables: {
                entryId
            }
        })
    })
)(EntryComponent)