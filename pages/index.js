import Layout from '../components/layout'
import withPage from '../providers/page'
import ResponsiveEmbed from 'react-responsive-embed'
import News from '../components/news'

export default withPage((props) => {
  return <Layout title="Sorters Club" page="home">
      <div className="container">
        <h1>Sorters Club</h1>
        <News/>
      </div>
    </Layout>  
})
