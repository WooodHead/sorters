import Layout from '../components/layout'
import withPage from '../providers/page'
import News from '../components/news'

export default withPage(() => (
    <Layout title="News" page="news">
        <div className="container">
            <h1>News</h1>
            <p>See what happened recently in the community.</p>
            <News/>
        </div>
    </Layout>
))
