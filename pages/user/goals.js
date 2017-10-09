import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import UserHeader from '../../components/user-header'

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-goals">
        <div className="container">
            <UserGoals username={username}/>
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
            goals
        }
        goals {
            title
            description
            doing
            done
        }
    }
}
`
const UserGoalsComponent = (props) => {
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
    const {about, name, goals} = profile
    const emailHash = user.emailHash
    const goalsList = user.goals || []

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="goals"/>
        <h2>Goals</h2>
        {goals &&
            <Markdown content={goals}/>
        }
        {goalsList.length > 0 ?
            <ul>
                {goalsList.map(({title, description, doing, done}, key) => {
                    const goalStatus = done ? 'done' : (doing ? 'doing' : 'not')
                    return <li key={key}>
                        <span>{title}</span>
                        {goalStatus === 'doing' && <span> ⛏</span>}
                        {goalStatus === 'done' && <span> ✔</span>}
                    </li>
                })}
            </ul>
        :
            <p>No goals</p>
        }
    </div>   
}
const UserGoals = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserGoalsComponent)
