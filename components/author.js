import Gravatar from 'react-gravatar'

export default function Author({user}) {
    const username = user.local && user.local.username
    const hash = user.emailHash || username
    const name = (user.profile && user.profile.name) || `/u/${username}`
    return <div style={{
        marginBottom: '1.5rem'
    }}>
        <Gravatar md5={hash} size={48} style={{
            marginRight: '1.5rem',
            float: 'left'
        }}/>
        <a href={`/u/${username}`}>{name}</a>
        <div style={{
            clear: 'both'
        }}></div>
    </div>
}
