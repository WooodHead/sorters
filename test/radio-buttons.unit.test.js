import RadioButtons from '../components/radio-buttons'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('radio-buttons', () => {
    it('shallow-renders', () => {
        const component = shallow(<RadioButtons
            id="buttons"
            label="Buttons"
            defaultValue="foo"
            values={{
                foo: {
                    label: 'Foo',
                },
                bar: {
                    label: 'Bar'
                },
            }}
        />)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
