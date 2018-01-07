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

export default withPage(({url: {query: {goalId}}}) => (
    <Goal goalId={goalId}/>
))

const GoalQuery = gql`
    query($goalId: ID!) {
        goal(_id: $goalId) {
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
            description
            entries {
                _id
                title
                url
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
const GoalComponent = (props) => {
    const {data: {loading, goal, error, refetch}} = props
    if (loading) {
        return <Layout title="Loading goal" page="user">
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

    if (!goal) {
        return <Layout title="Invalid goal" page="user">
            <div className="container">
                <p>Invalid goal.</p>
            </div>
        </Layout>
    }

    const {_id, title, url, content, entries, conversations, comments, user} = goal
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash

    return <Layout title={title} page="user">
        <div className="container">
            <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="goals" />
            <h1>
                {title}
            </h1>
            {content &&
                <Markdown content={content}/>
            }
            <Related entities={entries} label="Entries:" type="entry"/>
            <Related entities={conversations} label="Conversations:" type="conversation"/>
            <Comments comments={comments} entityType="goal" entityId={_id} onNewComment={refetch} onChangeComment={refetch} onDeleteComment={refetch}/>
        </div>
    </Layout>
}
const Goal = compose(
    graphql(GoalQuery, {
        options: ({goalId}) => ({
            variables: {
                goalId
            }
        })
    })
)(GoalComponent)