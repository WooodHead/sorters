import Layout from '../components/layout'
import withPage from '../providers/page'
import ResponsiveEmbed from 'react-responsive-embed'
import News from '../components/news'

export default withPage((props) => {
  return <Layout title="Sort yourself out!" page="home">
        <div className="container">
          <div className="jumbotron">
              <h1>Sort yourself out!</h1>
              <p>Join the community of people who like Prof. Jordan Peterson's advice and want to sort themselves out!</p>
              <div style={{
                maxWidth: '100%',
                width: '480px',
                margin: 'auto',
                marginBottom: '24px',
              }}>
                <ResponsiveEmbed src='https://www.youtube.com/embed/3Z7t92_3ESE' ratio='16:9' />
              </div>
              <p><a className="btn btn-primary btn-lg" href="/about" role="button">Learn more &raquo;</a></p>
          </div>
          <div className="row">
            <div className="col-md-4">
              <h2>Follow other sorters</h2>
              <p>Peterson started a movement of people who want to change the world by starting from themselves. See what's happening in the sorter community.</p>
              <p><a className="btn btn-default" href="/users" role="button">See community &raquo;</a></p>
            </div>
            <div className="col-md-4">
              <h2>Share your goals</h2>
              <p>Orient yourself towards the best possible good. Whether you have done the self-authoring suite (recommended) or not, here you can share your vision with the community.</p>
              <p><a className="btn btn-default" href="/register" role="button">Register &raquo;</a></p>
            </div>
            <div className="col-md-4">
              <h2>Read, write, speak</h2>
              <p>Rescue your father from the belly of the beast by reading the great works of your culture. Become articulate by writing and speaking about them. Share it all in your reading list.</p>
              <p><a className="btn btn-default" href="/u/nmaro" role="button">See an example &raquo;</a></p>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <h2>Begin the sorter journey</h2>
              <p>Share your progress as you clean your room and learn to read, write and speak, all the while rescuing your father from the underworld.</p>
              <p><a className="btn btn-default" href="/register" role="button">Register &raquo;</a></p>
            </div>
            <div className="col-md-4">
              <h2>Free and open source</h2>
              <p>You can use this platform freely. If you are a coder you can even contribute to its development on GitHub.</p>
              <p><a className="btn btn-default" href="https://github.com/nmaro/sorters" role="button" target="_blank">Source code &raquo;</a></p>
            </div>
            <div className="col-md-4">
              <h2>Support on Patreon</h2>
              <p>Become a supporter and discuss the development of Sorters Club on Patreon.</p>
              <p><a className="btn btn-default" href="https://www.patreon.com/nickredmark" role="button" target="_blank">Support &raquo;</a></p>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <h2>Latest news</h2>
              <News limit={50}/>
              <p><a href="/news">More news</a></p>
            </div>
          </div>
        </div>
    </Layout>  
})
