const MENU = [
    {
        url: '',
        name: 'dashboard',
        label: '⌂ Dashboard',
    },
    {
        url: '/profile',
        name: 'profile',
        label: '👤 Profile',
    },
    {
        url: '/messages',
        name: 'messages',
        label: '🗩 Messages',
    },
    {
        url: '/goals',
        name: 'goals',
        label: '◎ Goals',
    },
    {
        url: '/journal',
        name: 'journal',
        label: '✎ Journal',
    },
    {
        url: '/topics',
        name: 'topics',
        label: '💡 Topics',
    },
    {
        url: '/essays',
        name: 'essays',
        label: '✎ Essays',
    },
    {
        url: '/speeches',
        name: 'speeches',
        label: '👄 Speeches',
    },
    {
        url: '/conversations',
        name: 'conversations',
        label: '🗩 Conversations',
    },
    {
        url: '/reads',
        name: 'reads',
        label: '📖 Reading List',
    },
    {
        url: '/account',
        name: 'account',
        label: '⚙ Account',
    },
]

export default ({route}) => (
    <div>
        <h1>Account</h1>
        <ul className="nav nav-tabs">
            {MENU.map(({url, name, label}) => <li key={name} role="presentation" className={route === name ? 'active': undefined}>
                <a href={`/account${url}`}>{label}</a>
            </li>)}
        </ul>
    </div>
)