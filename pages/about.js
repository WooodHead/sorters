import Layout from '../components/layout'
import withPage from '../providers/page'
import ResponsiveEmbed from 'react-responsive-embed'

export default withPage(() => (
  <Layout title="About Sorters Club" page="about">
      <div className="container">
        <h2>About Sorters Club</h2>
        <p>This is a Jordan Peterson fan site, and a resource for people who want to follow his advice.</p>
        <p>It is based mainly on Peterson's <a href="https://www.youtube.com/watch?v=XbOeO_frzvg">Message to Millennials</a>:</p>
        <div style={{
          maxWidth: '100%',
          width: '480px',
          marginBottom: '24px',
        }}>
          <ResponsiveEmbed src='https://www.youtube.com/embed/XbOeO_frzvg' ratio='16:9' />
        </div>
        <p>Check out the profiles of other <a href="/users">sorters</a> do to get an idea of what you can do on this platform.</p>
        <p>Support this platform on <a href="https://www.patreon.com/nickredmark" target="_blank">Patreon</a>.</p>
        <p>For now you can become a member only by becoming a patron. It's the easiest way to avoid spam and to get good quality users and content on the platform.</p>
        <h2>About Nick Redmark</h2>
        <p>Hi, I'm Nick Redmark, I'm the developer of this platform. I created it mainly for myself, to document my progress as I try to "sort myself out" and "rescue my father from the underworld". Check out more things I do on my <a href="http://nickredmark.com" target="_blank">personal site</a>.</p>
        <p><b>Note for Prof. Peterson:</b> If you happen to end up on this site, I'd like to express my gratitude for what you are doing, and let you know that I'd be delighted to collaborate with you on any project you might have to help people sort themselves out in a more systematic way. In particular I find your project of building an online university for the humanities deeply inspiring.</p>
        <img src="/static/nickredmark.jpg" style={{
          maxWidth: '100%',
          width: '200px'
        }}/>
      </div>
  </Layout>
))
