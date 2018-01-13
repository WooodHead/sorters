import Layout from 'staart/lib/components/layout'
import React from 'react'

const menu = [
    {
        url: '/',
        name: 'home',
        label: 'Home',
    },
    {
        url: '/about',
        name: 'about',
        label: 'About',
    },
    {
        url: '/users',
        name: 'users',
        label: 'Sorters',
    },
]

const userMenu = [
    {
        url: '/account',
        name: 'dashboard',
        label: '⌂ Dashboard',
    },
    {
        url: '/account/profile',
        name: 'profile',
        label: '👤 Profile',
    },
    {
        url: '/account/messages',
        name: 'messages',
        label: '🗩 Messages',
    },
    {
        url: '/account/goals',
        name: 'goals',
        label: '◎ Goals',
    },
    {
        url: '/account/journal',
        name: 'journal',
        label: '✎ Journal',
    },
    {
        url: '/account/topics',
        name: 'topics',
        label: '💡 Topics',
    },
    {
        url: '/account/essays',
        name: 'essays',
        label: '✎ Essays',
    },
    {
        url: '/account/speeches',
        name: 'speeches',
        label: '👄 Speeches',
    },
    {
        url: '/account/conversations',
        name: 'conversations',
        label: '🗩 Conversations',
    },
    {
        url: '/account/reads',
        name: 'reads',
        label: '📖 Reading List',
    },
    {
        url: '/account/account',
        name: 'account',
        label: '⚙ Account',
    },
    {
        url: '/logout',
        name: 'logout',
        label: 'Log out',
    },
]

const siteName = 'Sorters Club'

export default (props) => (
    <Layout
        menu={menu}
        userMenu={userMenu}
        siteName={siteName}
        footerMessage={<p>Brought to you with ❤ by <a href="/about">Nick Redmark</a>. Support this platform on <a href="https://www.patreon.com/nickredmark" target="_blank">Patreon</a>.</p>}
        {...props}
        title={props.title ? `${siteName} - ${props.title}` : props.title}
    />
)