import Gravatar from 'react-gravatar'

export function username(user) {
    return user.local && user.local.username
}

export function displayName(user) {
    return (user.profile && user.profile.name) || `/u/${username(user)}`
}

export function hash(user) {
    return user.emailHash || username(user)
}

export function UserLink({user}) {
    return <a href={`/u/${username(user)}`}>{displayName(user)}</a>
}

export function Avatar({user}) {
    return <Gravatar md5={hash(user)} size={24}/>
}
