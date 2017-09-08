import Panel from './panel'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('panel', () => {
    it('shallow-renders', () => {
        const component = shallow(<Panel
            title="Title"
            url="/foo"
            label="Foo"
        ><p>Hi</p></Panel>)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
