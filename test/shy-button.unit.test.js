import ShyButton from '../components/shy-button'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('shy-button', () => {
    it('shallow-renders', () => {
        const component = shallow(<ShyButton>✎</ShyButton>)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
