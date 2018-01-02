import Layout from '../../components/layout'
import withPage from '../../providers/page'
import Account from 'staart/lib/components/account'
import AccountHeader from '../../components/account-header'

export default withPage(() => (
    <Layout title="Account" page="account">
    	<div className="container">
            <AccountHeader route="account"/>
            <Account/>
        </div>
    </Layout>
))
