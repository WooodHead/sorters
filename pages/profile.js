import {Component} from 'react'
import Layout from '../components/layout'
import withPage from '../providers/page'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import {errorMessage} from '../utils/errors'
import CountryList from 'country-list'
import RadioButtons from '../components/radio-buttons'

const countries = new CountryList()

export default withPage(() => (
    <Layout title="Profile" page="profile">
        <Profile/>
    </Layout>
))

class ProfileComponent extends Component {
    render() {
        return <div style={{
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <h1>Profile</h1>
            <ProfileForm/>
        </div>
    }
}
const Profile = compose(
    withLoginRequired('/profile'),
)(ProfileComponent)

const profileFields = [
    {
        title: 'Intro',
        fields: [
            {
                name: 'name',
                label: 'Name',
            },
            {
                name: 'about',
                label: 'About you',
                type: 'shortText',
                placeholder: 'Write a short blurb about yourself.'
            },
            {
                name: 'bio',
                label: 'Bio',
                type: 'text',
                placeholder: 'Tell us about yourself in more detail.'
            },
        ]
    },
    {
        title: 'Online Presence',
        fields: [
            {
                name: 'website',
                label: 'Website',
                type: 'url',
            },
            {
                name: 'blog',
                label: 'Blog',
                type: 'url',
            },
            {
                name: 'youtube',
                label: 'Youtube',
                type: 'url',
            },
            {
                name: 'twitter',
                label: 'Twitter Handle',
                placeholder: 'e.g. johnsmith',
            },
            {
                name: 'reddit',
                label: 'Reddit Username',
                placeholder: 'e.g. johnsmith',
            },
            {
                name: 'patreon',
                label: 'Patreon Username',
                placeholder: 'e.g. johnsmith',
            },
        ]
    },
    {
        title: 'Personal Information',
        fields: [
            {
                name: 'gender',
                label: 'Are you a man or a woman?',
                type: 'radio',
                options: {
                    male: {
                        label: 'I am a man'
                    },
                    female: {
                        label: 'I am a woman'
                    },
                },
            },
            {
                name: 'birthDate',
                label: 'Date of birth',
                type: 'date',
            },
            {
                name: 'city',
                label: 'City',
            },
            {
                name: 'country',
                label: 'Country',
                type: 'select',
                options: countries.getCodeList(),
            }
        ]
    },
    {
        title: 'Self Authoring Suite',
        fields: [
            {
                name: 'selfAuthoringPast',
                label: 'Completed Past Authoring',
                type: 'check',
            },
            {
                name: 'selfAuthoringPresentVirtues',
                label: 'Completed Present Virtues',
                type: 'check',
            },
            {
                name: 'selfAuthoringPresentFaults',
                label: 'Completed Present Faults',
                type: 'check',
            },
            {
                name: 'selfAuthoringFuture',
                label: 'Completed Future Authoring',
                type: 'check',
            },
        ]
    },
    {
        title: 'Unterstand Myself',
        fields: [
            {
                name: 'understandMyself',
                label: 'Completed Understand Myself Program',
                type: 'check'
            },
            {
                name: 'agreeableness',
                label: 'Agreeableness',
                placeholder: 'percentile, e.g. 37',
                type: 'int',
            },
            {
                name: 'compassion',
                label: 'Compassion',
                type: 'int',
            },
            {
                name: 'politeness',
                label: 'Politeness',
                type: 'int',
            },
            {
                name: 'conscientiousness',
                label: 'Conscientiousness',
                type: 'int',
            },
            {
                name: 'industriousness',
                label: 'Industriousness',
                type: 'int',
            },
            {
                name: 'orderliness',
                label: 'Orderliness',
                type: 'int',
            },
            {
                name: 'extraversion',
                label: 'Extraversion',
                type: 'int',
            },
            {
                name: 'enthusiasm',
                label: 'Enthusiasm',
                type: 'int',
            },
            {
                name: 'assertiveness',
                label: 'Assertiveness',
                type: 'int',
            },
            {
                name: 'neuroticism',
                label: 'Neuroticism',
                type: 'int',
            },
            {
                name: 'withdrawal',
                label: 'Withdrawal',
                type: 'int',
            },
            {
                name: 'volatility',
                label: 'Volatility',
                type: 'int',
            },
            {
                name: 'opennessToExperience',
                label: 'Openness to Experience',
                type: 'int',
            },
            {
                name: 'intellect',
                label: 'Intellect',
                type: 'int',
            },
            {
                name: 'openness',
                label: 'Openness',
                type: 'int',
            },
        ]
    }
]

const ProfileQuery = gql`
    query {
        me {
            local {
                username
            }
            profile {
                name
                about
                bio
                website
                blog
                youtube
                twitter
                reddit
                patreon
                gender
                birthDate
                city
                country
                selfAuthoringPast
                selfAuthoringPresentVirtues
                selfAuthoringPresentFaults
                selfAuthoringFuture
                understandMyself
                agreeableness
                compassion
                politeness
                conscientiousness
                industriousness
                orderliness
                extraversion
                enthusiasm
                assertiveness
                neuroticism
                withdrawal
                volatility
                opennessToExperience
                intellect
                openness
            }
        }
    }
`
const UpdateProfileQuery = gql`
    mutation($profile: ProfileInput) {
        updateProfile(profile: $profile) {
            _id
        }
    }
`
class ProfileFormComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {profile: {loading, me, refetch}, updateProfile} = this.props
        const username = me && me.local && me.local.username
        const profile = (me && me.profile) || {}
        return <div>
            {loading ?
                <span>Loading...</span>
            :
                <div>
                    {username ?
                        <div>
                            <p>Your profile is live at <a href={`/u/${username}`}>/u/{username}</a>. Please only save information you feel comfortable sharing publicly.</p>
                            <h2>Edit Profile</h2>
                            <Form
                                onSubmit={() => {
                                    const profile = {}
                                    for (const section of profileFields) {
                                        for (const {name, type} of section.fields) {
                                            let value = this[name].value
                                            switch (type) {
                                                case 'check':
                                                    value = !!this[name].checked
                                                    break
                                                case 'url':
                                                    if (value && !/^https?:\/\/.+/.test(value)) {
                                                        value = 'http://' + value
                                                    }
                                                    break
                                                case 'radio':
                                                    value = Object.keys(this[name].radios).find(key => this[name].radios[key].checked)
                                                    break
                                                case 'date':
                                                    if (value) {
                                                        value = new Date(value)
                                                    }
                                                    break
                                                case 'int':
                                                    if (value.length) {
                                                        value = parseInt(value)
                                                    } else {
                                                        value = undefined
                                                    }
                                                    break
                                            }
                                            profile[name] = value
                                        }
                                    }
                                    updateProfile({
                                        variables: {
                                            profile
                                        }
                                    })
                                    .then(() => {
                                        this.setState({
                                            state: 'success',
                                            message: 'Profile updated!'
                                        })
                                    })
                                    .catch(e => {
                                        this.setState({
                                            state: 'error',
                                            message: errorMessage(e)
                                        })
                                    })
                                }}
                                state={this.state.state}
                                message={this.state.message}
                                submitLabel="Save profile"
                            >
                                {profileFields.map(({title, fields}, i) => (
                                    <div key={i}>
                                        <h2>{title}</h2>
                                        {fields.map(({name, label, type, placeholder, options}) => {
                                            switch (type) {
                                                case 'text':
                                                    return <div key={name} className="form-group">
                                                        <label htmlFor={name}>{label}</label>
                                                        <textarea
                                                            className="form-control"
                                                            rows="4"
                                                            ref={ref => {
                                                                this[name] = ref
                                                            }}
                                                            defaultValue={profile[name]}
                                                            placeholder={placeholder}
                                                        />
                                                    </div>
                                                case 'shortText':
                                                    return <div key={name} className="form-group">
                                                        <label htmlFor={name}>{label}</label>
                                                        <textarea
                                                            name={name}
                                                            className="form-control"
                                                            rows="2"
                                                            ref={ref => {
                                                                this[name] = ref
                                                            }}
                                                            defaultValue={profile[name]}
                                                            placeholder={placeholder}
                                                        />
                                                    </div>
                                                case 'check':
                                                    return <div key={name} className="checkbox">
                                                        <label>
                                                            <input
                                                                name={name}
                                                                type="checkbox"
                                                                defaultChecked={profile[name]}
                                                                ref={ref => {
                                                                    this[name] = ref
                                                                }}
                                                            />
                                                            {label}
                                                        </label>
                                                    </div>
                                                case 'select':
                                                    return <div key={name} className="form-group">
                                                        <label htmlFor={name}>{label}</label>
                                                        <select
                                                            className="form-control"
                                                            name={name}
                                                            defaultValue={profile[name]}
                                                            ref={ref => {
                                                                this[name] = ref
                                                            }}
                                                        >
                                                            <option/>
                                                            {Object.keys(options).map(option => (
                                                                <option key={option} value={option}>{options[option]}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                case 'radio':
                                                    return <RadioButtons
                                                            key={name}
                                                            id={name}
                                                            name={name}
                                                            label={label}
                                                            defaultValue={profile[name]}
                                                            ref={ref => {
                                                                this[name] = ref
                                                            }}
                                                            values={options}
                                                        />
                                                default:
                                                    let value = profile[name]
                                                    if (type === 'date' && value) {
                                                        value = new Date(value).toISOString().split('T')[0];
                                                    }
                                                    return <div key={name} className="form-group">
                                                        <label htmlFor={name}>{label}</label>
                                                        <input
                                                            type={type || "text"}
                                                            className="form-control"
                                                            id={name}
                                                            ref={ref => {
                                                                this[name] = ref
                                                            }}
                                                            defaultValue={value}
                                                            placeholder={placeholder}
                                                        />
                                                    </div>
                                            }
                                        })}
                                        {i < profileFields.length - 1 &&
                                            <div>
                                                {this.state.state === 'success' &&
                                                    <div className="alert alert-success" role="alert">
                                                        {this.state.message}
                                                    </div>
                                                }
                                                {this.state.state === 'error' &&
                                                    <div className="alert alert-danger" role="alert">
                                                        {this.state.message}
                                                    </div>
                                                }
                                                <button type="submit" className="btn btn-primary btn-block">Save profile</button>
                                            </div>
                                        }
                                    </div>
                                ))}
                            </Form>
                        </div>
                    :
                        <div>
                            <h2>Username</h2>
                            <p>To activate your profile set a username in your <a href="/account">account page</a>.</p>
                        </div>
                    }
                </div>
            }
        </div>
    }
}
const ProfileForm = compose(
    graphql(ProfileQuery, {
        name: 'profile'
    }),
    graphql(UpdateProfileQuery, {
        name: 'updateProfile'
    })
)(ProfileFormComponent)
