import {Component} from 'react'
import {compose} from 'recompose'
import {withUser} from 'ooth-client-react'
import withLoginRequired from 'staart/lib/hocs/login-required'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import RawPanel from '../../components/panel'

const Panel = (props) => (
  <div className="col-md-4">
    <RawPanel {...props}/>
  </div>
)

export default withPage(() => (
    <Layout title="Dashboard" page="dashboard">
        <Dashboard/>
    </Layout>
))

const DashboardComponent = ({user}) => (
    <div className="container">
      <h1>Dashboard</h1>
      {user.local && user.local.username &&
        <p>
            Your profile can be found at <a href={`/u/${user.local.username}`}>{`/u/${user.local.username}`}</a>.
        </p>
      }
      <div className="alert alert-info">
        <p>Thank you for joining sorters club! This is your dashboard. As the platform develops, you will find more features here.</p>
      </div>
      <div className="row">
        <Panel title="👤 Profile" url="/account/profile" label="Manage profile">
          <p>Edit your public profile.</p>
        </Panel>
        <Panel title="◎ Goals" url="/account/goals" label="Manage goals">
          <p>Share your goals and leave updates.</p>
        </Panel>
        <Panel title="✎ Journal" url="/account/journal" label="Manage Journal">
          <p>Write updates about your goals.</p>
        </Panel>
      </div>
      <div className="row">
        <Panel title={<span>💡 Topics <span className="badge pull-right">new</span></span>} url="/account/topics" label="Manage Topics">
          <p>Share what topics you are interested in.</p>
        </Panel>
        <Panel title={<span>✎ Essays <span className="badge pull-right">new</span></span>} url="/account/essays" label="Manage Essays">
          <p>Write essays about the topics you are interested in or about the books you read.</p>
        </Panel>
        <Panel title={<span>👄 Speeches <span className="badge pull-right">new</span></span>} url="/account/speeches" label="Manage Speeches">
          <p>Give speeches about the topics you are interested in or about the books you read.</p>
        </Panel>
      </div>
      <div className="row">
        <Panel title={<span>🗩 Conversations <span className="badge pull-right">new</span></span>} url="/account/conversations" label="Start Conversations">
          <p>Have conversations with other sorters about topics you are interested in.</p>
        </Panel>
        <Panel title="📖 Reading list" url="/account/reads" label="Manage Reading List">
          <p>Create a list of things you read and intend to read.</p>
        </Panel>
        <Panel title="👫 Sorters" url="/account/news" label="Sorters">
          <p>See what other sorters are doing.</p>
        </Panel>
      </div>
      <div className="row">
        <Panel title="🗩 Chat" url="https://discord.gg/6Q8v9Sm" label="Chat" target="_blank">
          <p>Chat with other sorters (a Discord channel).</p>
        </Panel>
        <Panel title="⚙ Account" url="/account/account" label="Manage Account">
          <p>Set your username, password etc.</p>
        </Panel>
      </div>
    </div>
)
const Dashboard = compose(
    withLoginRequired('/account'),
    withUser
)(DashboardComponent)