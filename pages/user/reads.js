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
            title
            reading
            read
            articleUrl
            videoUrl
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
                {reads.map(({title, reading, read, articleUrl, videoUrl}, key) => {
                    const readingStatus = read ? 'read' : (reading ? 'reading' : 'not')
                    return <li key={key}>
                        <span>{title}</span>
                        {readingStatus === 'read' && <span>&nbsp;✔</span>}
                        {readingStatus === 'reading' && <span>&nbsp;👁</span>}
                            {(articleUrl || videoUrl) && <span>&nbsp;(
                            {articleUrl && <a href={articleUrl}>article</a>}
                            {articleUrl && videoUrl && <span>,&nbsp;</span>}
                            {videoUrl && <a href={videoUrl}>video</a>}
                        )</span>}
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
