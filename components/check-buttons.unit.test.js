import CheckButtons from './check-buttons'
import renderer from 'react-test-renderer'
import { shallow } from 'enzyme'
import toJson from 'enzyme-to-json'

describe('check-buttons', () => {
    it('shallow-renders', () => {
        const component = shallow(<CheckButtons
            id="buttons"
            label="Buttons"
            values={{
                foo: {
                    label: 'Foo',
                },
                bar: {
                    label: 'Bar',
                    default: true,
                },
            }}
        />)
        const tree = toJson(component)
        expect(tree).toMatchSnapshot()
    })
})
