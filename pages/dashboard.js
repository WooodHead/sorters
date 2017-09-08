import {Component} from 'react'
import Layout from '../components/layout'
import withPage from '../providers/page'
import {compose} from 'recompose'
import {withUser} from 'ooth-client-react'
import withLoginRequired from 'staart/lib/hocs/login-required'
import RawPanel from '../components/panel'

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
        <Panel title="👤 Profile" url="/profile" label="Manage profile">
          <p>Edit your public profile that can be seen by others.</p>
        </Panel>
        <Panel title="◎ Goals" url="/goals" label="Manage goals">
          <p>Share your goals and leave updates.</p>
        </Panel>
        <Panel title="✎ Journal" url="/journal" label="Manage Journal">
          <p>Write updates about your goals.</p>
        </Panel>
      </div>
      <div className="row">
        <Panel title="📖 Reading list" url="/reads" label="Manage Reading List">
          <p>Create a list of things you read and intend to read.</p>
        </Panel>
        <Panel title="👫 Sorters" url="/users" label="Sorters">
          <p>See what other sorters are doing.</p>
        </Panel>
        <Panel title="🗩 Chat" url="https://discord.gg/6Q8v9Sm" label="Chat">
          <p>Chat with other sorters (a Discord channel).</p>
        </Panel>
      </div>
      <div className="row">
        <Panel title="⚙ Account" url="/account" label="Manage Account">
          <p>Set your username, password etc.</p>
        </Panel>
      </div>
    </div>
)
const Dashboard = compose(
    withLoginRequired('/dashboard'),
    withUser
)(DashboardComponent)