import DeleteModal from '../components/delete-modal'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('delete-modal', () => {
    it('shallow-renders', () => {
        const component = shallow(<DeleteModal
            title="Delete book?"
            message="A deleted book can't be recovered."/>)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
