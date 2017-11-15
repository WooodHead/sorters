import Layout from '../components/layout'
import withPage from '../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../components/markdown'
import Comments from '../components/comments'
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
                }
                local {
                    username
                }
            }
            title
            url
            description
            goalTitles
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

    const {_id, title, url, description, goalTitles, comments,user} = entry

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
            {description &&
                <Markdown content={description}/>
            }
            {goalTitles.length > 0 &&
                <div>
                    Goals: {goalTitles.map((goal, i) => (
                        <span key={i}>{i ? ', ' : ' '}<em>{goal}</em></span>
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