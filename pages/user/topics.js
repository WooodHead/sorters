import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-topics">
        <div className="container">
            <UserTopics username={username}/>
        </div>
    </Layout>
))

const UserQuery = gql`
query($username: String!) {
    userByUsername(username: $username) {
        local {
            username
        }
        emailHash
        profile {
            name
            about
            topics
        }
        topics {
            title
            description
            essays {
                title
                url
            }
            speeches {
                title
                url
            }
            conversations {
                title
            }
        }
    }
}
`
const UserTopicsComponent = (props) => {
    const {data: {loading, userByUsername: user, error}} = props
    
    if (loading) {
        return <p>Loading...</p>
    }
    
    if (error) {
        return <p>{error}</p>
    }
    
    if (!user) {
        return <p>Invalid user.</p>
    }
    
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name, topics} = profile
    const emailHash = user.emailHash
    const topicsList = user.topics || []

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="topics"/>
        <h2>Topics</h2>
        {topics &&
            <Markdown content={topics}/>
        }
        {topicsList.length > 0 ?
            <ul>
                {topicsList.map(({title, description, essays, speeches, conversations}, key) => {
                    return <li key={key}>
                        <span>{title}</span>
                        <ul>
                            {essays.length > 0 &&
                                <li>✎ Essays: 
                                    {essays.map((essay, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        <a href={essay.url || `/essay/${essay._id}`}>{essay.title}</a>
                                    </span>))}
                                </li>
                            }
                            {speeches.length > 0 &&
                                <li>👄 Speeches: 
                                    {speeches.map((speech, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        <a href={speech.url || `/speech/${speech._id}`}>{speech.title}</a>
                                    </span>))}
                                </li>
                            }
                            {conversations.length > 0 &&
                                <li>🗩 Conversations: 
                                    {conversations.map((conversation, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        <a href={conversation.url || `/conversation/${conversation._id}`}>{conversation.title}</a>
                                    </span>))}
                                </li>
                            }
                        </ul>
                    </li>
                })}
            </ul>
        :
            <p>No topics</p>
        }
    </div>   
}
const UserTopics = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserTopicsComponent)