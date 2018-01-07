import Layout from '../../components/layout'
import withPage from '../../providers/page'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import {compose} from 'recompose'
import Markdown from '../../components/markdown'
import CountryList from 'country-list'
import UserHeader from '../../components/user-header'
import {PROGRAMS} from '../../models/programs'

const countries = new CountryList()

export default withPage(({url: {query: {username}}}) => (
    <Layout title="Sorter" page="user-profile">
        <div className="container">
            <User username={username}/>
        </div>
    </Layout>
))

const urlFields = [
    {
        name: 'website',
        label: 'Website'
    },
    {
        name: 'blog',
        label: 'Blog'
    },
    {
        name: 'youtube',
        label: 'Youtube'
    },
    {
        name: 'twitter',
        label: 'Twitter',
        url: handle => `https://www.twitter.com/${handle}`,
    },
    {
        name: 'reddit',
        label: 'Reddit',
        url: handle => `https://reddit.com/user/${handle}`,
    },
    {
        name: 'patreon',
        label: 'Patreon',
        url: handle => `https://www.patreon.com/${handle}`,
    }
]

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
                bio
                website
                blog
                youtube
                twitter
                reddit
                patreon
                gender
                birthDate
                city
                country
                selfAuthoringPast
                selfAuthoringPresentVirtues
                selfAuthoringPresentFaults
                selfAuthoringFuture
                understandMyself
                agreeableness
                compassion
                politeness
                conscientiousness
                industriousness
                orderliness
                extraversion
                enthusiasm
                assertiveness
                neuroticism
                withdrawal
                volatility
                opennessToExperience
                intellect
                openness
            }
            reads {
                _id
            }
            goals {
                _id
            }
            topics {
                _id
            }
            entries {
                _id
            }
            essays {
                _id
            }
            speeches {
                _id
            }
            conversations {
                _id
            }
        }
    }
`
const UserComponent = (props) => {
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
    const emailHash = user.emailHash
    const profile = user.profile || {}
    const {
        name,
        about,
        bio,
        gender,
        birthDate,
        city,
        country,
        selfAuthoringPast,
        selfAuthoringPresentVirtues,
        selfAuthoringPresentFaults,
        selfAuthoringFuture,
        understandMyself,
        agreeableness,
        compassion,
        politeness,
        conscientiousness,
        industriousness,
        orderliness,
        extraversion,
        enthusiasm,
        assertiveness,
        neuroticism,
        withdrawal,
        volatility,
        opennessToExperience,
        intellect,
        openness,
    } = profile
    const goals = user.goals || []
    const reads = user.reads || []
    const topics = user.topics || []
    const {entries, essays, speeches, conversations} = user

    const urls = []
    urlFields.map(({name, label, url: urlMap}) => {
        let url = profile[name]
        if (url) {
            if (urlMap && !/^http/.test(url)) {
                url = urlMap(url)
            }
            urls.push({
                name,
                label,
                url,
            })
        }
    })

    return <div>
        <UserHeader name={name} username={username} emailHash={emailHash} about={about} route="profile"/>
        <h2>Summary</h2>
        <ul>
            {goals.length > 0 && <li>◎ {goals.length} <a href={`/u/${username}/goals`}>goals</a></li>}
            {entries.length > 0 && <li>✎ {entries.length} <a href={`/u/${username}/journal`}>journal entries</a></li>}
            {essays.length > 0 && <li>✎ {essays.length} <a href={`/u/${username}/essays`}>essays</a></li>}
            {speeches.length > 0 && <li>👄 {speeches.length} <a href={`/u/${username}/speeches`}>speeches</a></li>}
            {conversations.length > 0 && <li>🗩 {conversations.length} <a href={`/u/${username}/conversations`}>conversations</a></li>}
            {reads.length > 0 && <li>📖 {reads.length} <a href={`/u/${username}/reads`}>books in reading list</a></li>}
            {topics.length > 0 && <li>💡 {topics.length} <a href={`/u/${username}/topics`}>topics</a></li>}
            {gender === 'male' && <li>A man</li>}
            {gender === 'female' && <li>A woman</li>}
            {city && country ? <li>
                    City: {city}, {countries.getName(country)}
                </li>
            :
                (city ?
                    <li>City: {city}</li>
                :
                    country && <li>Country: {countries.getName(country)}</li>
                )
            }
        </ul>
        {urls.length > 0 && <div>
            <h2>Links</h2>
            <ul>
                {urls.map(({name, label, url}) => (
                    <li key={name}>
                        <label style={{
                            width: '100px',
                            marginRight: '1.5rem'
                        }}>{label}</label>
                        <a href={url}>{url}</a>
                    </li>
                ))}
            </ul>
        </div>}
        {bio && 
            <div>
                <h2>Bio</h2>
                <Markdown content={bio}/>
            </div>
        }
        {(selfAuthoringPast || selfAuthoringPresentFaults || selfAuthoringPresentVirtues || selfAuthoringFuture) &&
            <div>  
                <h2>Self Authoring suite</h2>
                <ul>
                    {selfAuthoringPast &&
                        <li>Completed {PROGRAMS.selfAuthoringPast}</li>
                    }
                    {selfAuthoringPresentFaults &&
                        <li>Completed {PROGRAMS.selfAuthoringPresentFaults}</li>
                    }
                    {selfAuthoringPresentVirtues &&
                        <li>Completed {PROGRAMS.selfAuthoringPresentVirtues}</li>
                    }
                    {selfAuthoringFuture &&
                        <li>Completed {PROGRAMS.selfAuthoringFuture}</li>
                    }
                </ul>
            </div>
        }
        {(understandMyself
            || agreeableness
            || compassion
            || politeness
            || conscientiousness
            || industriousness
            || orderliness
            || extraversion
            || enthusiasm
            || assertiveness
            || neuroticism
            || withdrawal
            || volatility
            || opennessToExperience
            || intellect
            || openness
        ) &&
            <div>
                <h2>Big 5</h2>
                <ul>
                    {understandMyself &&
                        <li>Completed {PROGRAMS.understandMyself}</li>
                    }
                    {(agreeableness || compassion || politeness) &&
                        <li>Agreeableness: {agreeableness}
                            {(compassion || politeness) &&
                                <ul>
                                    {compassion && <li>Compassion: {compassion}</li>}
                                    {politeness && <li>Politeness: {politeness}</li>}
                                </ul>
                            }
                        </li>
                    }
                    {(conscientiousness || industriousness || orderliness) &&
                        <li>Conscientiousness: {conscientiousness}
                            {(industriousness || orderliness) &&
                                <ul>
                                    {industriousness && <li>Industriousness: {industriousness}</li>}
                                    {orderliness && <li>Orderliness: {orderliness}</li>}
                                </ul>
                            }
                        </li>
                    }
                    {(extraversion || enthusiasm || assertiveness) &&
                        <li>Extraversion: {extraversion}
                            {(enthusiasm || assertiveness) &&
                                <ul>
                                    {enthusiasm && <li>Enthusiasm: {enthusiasm}</li>}
                                    {assertiveness && <li>Orderliness: {assertiveness}</li>}
                                </ul>
                            }
                        </li>
                    }
                    {(neuroticism || withdrawal || volatility) &&
                        <li>Neuroticism: {neuroticism}
                            {(withdrawal || volatility) &&
                                <ul>
                                    {withdrawal && <li>Withdrawal: {withdrawal}</li>}
                                    {volatility && <li>Volatility: {volatility}</li>}
                                </ul>
                            }
                        </li>
                    }
                    {(opennessToExperience || intellect || openness) &&
                        <li>Openness to experience: {opennessToExperience}
                            {(intellect || openness) &&
                                <ul>
                                    {intellect && <li>Intellect: {intellect}</li>}
                                    {openness && <li>Openness: {openness}</li>}
                                </ul>
                            }
                        </li>
                    }
                </ul>
            </div>
        }
    </div>
}
const User = compose(
    graphql(UserQuery, {
        options: ({username}) => ({
            variables: {
                username
            }
        })
    })
)(UserComponent)