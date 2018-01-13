import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import Gravatar from 'react-gravatar'
import UserHeader from '../../components/user-header'
import Related from '../../components/related-entities'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-essays">
        <div className="container">
            <UserEssays username={username}/>
        </div>
    </Layout>
))

const UserEssaysQuery = gql`
    query($username: String!) {
        userByUsername(username: $username) {
            _id
            local {
                username
            }
            emailHash
            profile {
                name
                about
            }
            essays {
                _id
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
            }
        }
    }
`
const UserEssaysComponent = (props) => {
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
    
    const _id = user._id
    const username = user.local.username
    const profile = user.profile || {}
    const {about, name} = profile
    const emailHash = user.emailHash
    const essays = user.essays

    return <div>
        <UserHeader id={_id} name={name} username={username} emailHash={emailHash} about={about} route="essays"/>
        <h2>Essays</h2>
        {essays.length > 0 ?
            essays.map((essay) => (
                <Essay
                    key={essay._id}
                    essay={essay}
                />
            ))
        : <p>No essays.</p>}
    </div>
}
const UserEssays = compose(
    graphql(UserEssaysQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserEssaysComponent)

const Essay = ({essay: {_id, url, title, content, topics, reads}}) => (
    <div style={{
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
    }}>
        <h3>
            {url ?
                <a href={url} target="_blank">{title}</a>
            :
                <a href={`/essay/${_id}`}>{title}</a>
            }
        </h3>
        {content &&
            <Markdown content={content}/>
        }
        <Related entities={topics} label="Topics:" type="topic"/>
        <Related entities={reads} label="Books:" type="read"/>
        <a href={`/essay/${_id}`}>Comments</a>
        <hr/>
    </div>
)
