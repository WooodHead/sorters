import Markdown from '../components/markdown'
import renderer from 'react-test-renderer'

describe('markdown', () => {
    it('renders', () => {
        const component = renderer.create(<Markdown content="### title"/>)
        const tree = component.toJSON()
        expect(tree).toMatchSnapshot()
    })
})