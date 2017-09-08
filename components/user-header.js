import Markdown from '../components/markdown'
import Gravatar from 'react-gravatar'

const MENU = [
    {
        url: '',
        name: 'activity',
        label: 'Activity',
    },
    {
        url: '/profile',
        name: 'profile',
        label: 'Profile',
    },
    {
        url: '/goals',
        name: 'goals',
        label: 'Goals',
    },
    {
        url: '/journal',
        name: 'journal',
        label: 'Journal',
    },
    {
        url: '/reads',
        name: 'reads',
        label: 'Reads',
    },
]

export default ({name, username, emailHash, about, route}) => (
    <div>
        <h1>
            {name || username}
        </h1>
        <div className="row">
            <div className="col-xs-6 col-sm-3 col-md-2">
                <Gravatar md5={emailHash || username} size={200} style={{
                    marginBottom: '24px',
                    width: '100%',
                    height: 'auto',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    display: 'block'
                }}/>
            </div>
            <div className="col-xs-12 col-sm-9 col-md-10">
                <p><a href={`/u/${username}`}>/u/{username}</a></p>
                {about && 
                    <div>
                        <Markdown content={about}/>
                    </div>
                }
            </div>
        </div>
        <ul className="nav nav-tabs">
            {MENU.map(({url, name, label}) => <li key={name} role="presentation" className={route === name && 'active'}>
                <a href={`/u/${username}${url}`}>{label}</a>
            </li>)}
        </ul>
    </div>
)