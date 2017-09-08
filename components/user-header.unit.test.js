import UserHeader from './user-header'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('user-header', () => {
    it('shallow-renders', () => {
        const component = shallow(<UserHeader
            name="Nick Redmark"
            username="nmaro"
            emailHash="foo"
            about="Hi there I'm Nick"
            route="journal"
        />)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
