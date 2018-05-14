import Layout from '../components/layout'
import withPage from '../providers/page'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('layout', () => {
    it('shallow-renders', () => {
        const component = shallow(<Layout/>)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })

    it('displays title and page', () => {
        const component = shallow(<Layout title="Sort yourself out!" page="home"/>)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()        
    })
})
