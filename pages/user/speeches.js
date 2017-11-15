import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import Gravatar from 'react-gravatar'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-speeches">
        <div className="container">
            <UserSpeeches username={username}/>
        </div>
    </Layout>
))

const UserSpeechesQuery = gql`
    query($username: String!) {
        userByUsername(username: $username) {
            local {
                username
            }
            emailHash
            profile {
                name
                about
            }
            speeches {
                _id
                title
                url
                content
                topicTitles
                readTitles
            }
        }
    }
`
const UserSpeechesComponent = (props) => {
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
    const {about, name} = profile
    const emailHash = user.emailHash
    const speeches = user.speeches

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="speeches"/>
        <h2>Speeches</h2>
        {speeches.length > 0 ?
            speeches.map((speech) => (
                <Speech
                    key={speech._id}
                    speech={speech}
                />
            ))
        : <p>No speech.</p>}
    </div>
}
const UserSpeeches = compose(
    graphql(UserSpeechesQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserSpeechesComponent)

const Speech = ({speech: {_id, url, title, content, topicTitles, readTitles}}) => (
    <div style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
    }}>
        <h3>
            {url ?
                <a href={url} target="_blank">{title}</a>
            :
                title
            }
        </h3>
        {content &&
            <Markdown content={content}/>
        }
        {topicTitles.length > 0 &&
            <div>
                Topics: {topicTitles.map((topic, i) => (
                    <span key={i}>{i ? ', ' : ' '}<em>{topic}</em></span>
                ))}
            </div>
        }
        {readTitles.length > 0 &&
            <div>
                Books: {readTitles.map((read, i) => (
                    <span key={i}>{i ? ', ' : ' '}<em>{read}</em></span>
                ))}
            </div>
        }
        <a href={`/speech/${_id}`}>Comments</a>
        <hr/>
    </div>
)
