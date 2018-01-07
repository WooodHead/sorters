import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-reads">
        <div className="container">
            <UserReads username={username}/>
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
            reading
        }
        reads {
            _id
            title
            reading
            read
            essays {
                _id
                title
                url
            }
            speeches {
                _id
                title
                url
            }
            conversations {
                _id
                title
            }
        }
    }
}
`
const UserReadsComponent = (props) => {
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
    const emailHash = user.emailHash
    const {name, about, reading} = profile
    const reads = user.reads || []

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="reads"/>
        <h2>Reads</h2>
        {reading && <Markdown content={reading}/>}
        {reads.length > 0 ?
            <ul>
                {reads.map(({_id, title, reading, read, essays, speeches, conversations}, key) => {
                    const readingStatus = read ? 'read' : (reading ? 'reading' : 'not')
                    return <li key={key}>
                        <a href={`/read/${_id}`}>{title}</a>
                        {readingStatus === 'read' && <span>&nbsp;✔</span>}
                        {readingStatus === 'reading' && <span>&nbsp;👁</span>}
                        <ul>
                            {essays.length > 0 &&
                                <li>✎ Essays: 
                                    {essays.map((essay, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        {essay.url ?
                                            <span>
                                                <a href={essay.url} target="_blank">{essay.title}</a>
                                                {' '}(<a href={`/essay/${essay._id}`}>comments</a>)
                                            </span>
                                        :
                                            <a href={`/essay/${essay._id}`}>{essay.title}</a>
                                        }
                                    </span>))}
                                </li>
                            }
                            {speeches.length > 0 &&
                                <li>👄 Speeches: 
                                    {speeches.map((speech, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        {speech.url ?
                                            <span>
                                                <a href={speech.url} target="_blank">{speech.title}</a>
                                                {' '}(<a href={`/speech/${speech._id}`}>comments</a>)
                                            </span>
                                        :
                                            <a href={`/speech/${speech._id}`}>{speech.title}</a>
                                        }
                                    </span>))}
                                </li>
                            }
                            {conversations.length > 0 &&
                                <li>🗩 Conversations: 
                                    {conversations.map((conversation, i) => (<span key={i}>
                                        {i ? ', ' : ' '}
                                        <a href={`/conversation/${conversation._id}`}>{conversation.title}</a>
                                    </span>))}
                                </li>
                            }
                        </ul>
                    </li>
                })}
            </ul>
        :
            <p>No reads</p>
        }
    </div>   
}
const UserReads = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserReadsComponent)
