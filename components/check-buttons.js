import {Component} from 'react'

class CheckButtons extends Component {
    constructor() {
        super()
        this.checks = {}
    }
    render() {
        return <div className="form-group">
            <label>{this.props.label}</label>
            {Object.keys(this.props.values).map(key => {
                const value = this.props.values[key]
                return <div className="checkbox" key={key}>
                    <label>
                        <input
                            type="checkbox"
                            id={this.props.id}
                            name={this.props.id}
                            value={key}
                            defaultChecked={value.default}
                            ref={ref => {
                                this.checks[key] = ref
                            }}
                        />
                        {value.label}
                    </label>
                </div>
            })}
        </div>
    }
}
export default CheckButtons
