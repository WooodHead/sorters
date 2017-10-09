import {Component} from 'react'

class RadioButtons extends Component {
    constructor() {
        super()
        this.radios = {}
    }
    render() {
        return <div className="form-group">
            <label>{this.props.label}</label>
            {Object.keys(this.props.values).map(key => {
                const value = this.props.values[key]
                return <div className="radio" key={key}>
                    <label>
                        <input
                            type="radio"
                            id={this.props.id}
                            name={this.props.id}
                            value={key}
                            defaultChecked={key === this.props.defaultValue}
                            ref={ref => {
                                this.radios[key] = ref
                            }}
                        />
                        {value.label}
                    </label>
                </div>
            })}
        </div>
    }
}
export default RadioButtons
