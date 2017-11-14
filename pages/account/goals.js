import {Component} from 'react'
import {compose} from 'recompose'
import {graphql} from 'react-apollo'
import gql from 'graphql-tag'
import withLoginRequired from 'staart/lib/hocs/login-required'
import Form from 'staart/lib/components/form'
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc'

import Layout from '../../components/layout'
import withPage from '../../providers/page'
import Markdown from '../../components/markdown'
import RadioButtons from '../../components/radio-buttons'
import ShyButton from '../../components/shy-button'
import DeleteModal from '../../components/delete-modal'
import {errorMessage} from '../../utils/errors'

export default withPage(() => (
    <Layout title="Goals" page="goals">
        <Goals/>
    </Layout>
))

const GoalsQuery = gql`
    query {
        me {
            local {
                username
            }
            goals {
                title
                description
                doing
                done
            }
            profile {
                goals
            }
        }
    }
`
const UpdateGoalsQuery = gql`
    mutation($goals: [GoalInput]!) {
        updateGoals(goals: $goals) {
            _id
        }
    }
`
const CreateGoalQuery = gql`
    mutation($goal: NewGoalInput!) {
        createGoal(goal: $goal) {
            _id
        }
    }
`
const UpdateGoalsDescriptionQuery = gql`
    mutation($goals: String) {
        updateGoalsDescription(goals: $goals) {
            _id
        }
    }
`
class GoalsComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {
            goals: {loading, me, refetch},
            updateGoals,
            createGoal,
            updateGoalsDescription,
        } = this.props
        const username = me && me.local && me.local.username
        const {goals: goalsDescription} = (me && me.profile) || {}
        const goals = (me && me.goals && me.goals.map(({
            title,
            description,
            doing,
            done,
        }) => ({
            title,
            description,
            doing,
            done,
        }))) || []

        return <div style={{
            maxWidth: '400px',
            margin: 'auto'
        }}>
            <h1>Goals</h1>
            {loading ?
                <span>Loading...</span>
            :
                (username ?
                    <div>
                        {goals.length > 0 && <p>Your public goal list can be found at <a href={`/u/${username}/goals`}>/u/{username}/goals</a>.</p>}
                        <h2>Description</h2>
                        <p>Here you can describe how you chose your goals.</p>
                        <Form
                            onSubmit={() => {
                                const goalsDescription = this.goalsDescription.value
                                updateGoalsDescription({
                                    variables: {
                                        goals: goalsDescription
                                    }
                                }).then(() => {
                                    this.setState({
                                        goalsDescriptionState: 'success',
                                        goalsDescriptionMessage: 'Goals description saved.'
                                    })
                                }).catch(e => {
                                    this.setState({
                                        goalsDescriptionState: 'error',
                                        goalsDescriptionMessage: errorMessage(e)
                                    })
                                })
                            }}
                            state={this.state.goalsDescriptionState}
                            message={this.state.goalsDescriptionMessage}
                            submitLabel="Save"
                        >
                            <div className="form-group">
                                <label htmlFor="goals-description">Description</label>
                                <textarea
                                    className="form-control"
                                    rows="4"
                                    ref={ref => this.goalsDescription = ref}
                                    defaultValue={goalsDescription}
                                />
                            </div>
                        </Form>
                        {goals.length > 0 &&
                            <div>
                                <h2>Your Goals</h2>
                                <GoalsList
                                    goals={goals}
                                    distance={1}
                                    onSortEnd={({oldIndex, newIndex}) => {
                                        const newGoals = arrayMove(goals, oldIndex, newIndex)
                                        updateGoals({
                                            variables: {
                                                goals: newGoals
                                            }
                                        }).then(() => {
                                            refetch();
                                        }).catch(e => {
                                            console.error(e)
                                        })
                                    }}
                                    updateGoal={(key, goal) => {
                                        goals[key] = goal;
                                        return updateGoals({
                                            variables: {
                                                goals
                                            }
                                        }).then(() => {
                                            refetch();
                                        })
                                    }}
                                    removeGoal={(key) => {
                                        goals.splice(key, 1)
                                        return updateGoals({
                                            variables: {
                                                goals
                                            }
                                        }).then(() => {
                                            refetch();
                                        }).catch(e => {
                                            console.error(e)
                                        })
                                    }}
                                />
                            </div>
                        }
                        <h3>New Goal</h3>
                        <Form
                            onSubmit={() => {
                                const goal = {
                                    title: this.title.value
                                }
                                createGoal({
                                    variables: {
                                        goal
                                    }
                                }).then(() => {
                                    this.title.value = ''
                                    this.setState({
                                        state: 'success',
                                        message: 'Goals updated!'
                                    }, refetch)
                                }).catch(e => {
                                    this.setState({
                                        state: 'error',
                                        message: errorMessage(e)
                                    })
                                })
                            }}
                            state={this.state.state}
                            message={this.state.message}
                            submitLabel="New Goal"
                        >
                            <div className="form-group">
                                <label htmlFor="title">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder={goals.length === 0 ? 'Clean my room' : ''}
                                    ref={ref => {
                                        this.title = ref
                                    }}
                                    required
                                />
                            </div>
                        </Form>
                    </div>
                :
                    <p>To activate your profile set a username in your <a href="/account">account page</a>.</p>
                )
            }
        </div>
    }
}
const Goals = compose(
    withLoginRequired('/account/goals'),
    graphql(GoalsQuery, {
        name: 'goals'
    }),
    graphql(UpdateGoalsQuery, {
        name: 'updateGoals'
    }),
    graphql(CreateGoalQuery, {
        name: 'createGoal'
    }),
    graphql(UpdateGoalsDescriptionQuery, {
        name: 'updateGoalsDescription'
    })
)(GoalsComponent)

const GoalsListComponent = ({goals, updateGoal, removeGoal}) => (
    <ul>
        {goals.map((goal, key) => (
            <Goal
                key={key}
                index={key}
                goal={goal}
                update={goal => updateGoal(key, goal)}
                remove={() => removeGoal(key)}
            />
        ))}
    </ul>
)
const GoalsList = compose(
    SortableContainer
)(GoalsListComponent)

class GoalComponent extends Component {
    constructor() {
        super()
        this.state = {}
    }
    render() {
        const {goal: {title, description, doing, done}, update, remove} = this.props
        const goalStatus = done ? 'done' : (doing ? 'doing' : 'not')
        return <li style={{
            cursor: 'pointer',
            clear: 'both',
        }}>
            {this.state.edit ?
                <Form
                    onSubmit={() => {
                        let goalStatus = ['done', 'doing', 'not']
                            .find(value => this.goalStatus.radios[value].checked) || 'not'
                        const goal = {
                            title: this.title.value,
                            doing: goalStatus === 'doing',
                            done: goalStatus === 'done',
                        }
                        update(goal)
                            .then(() => {
                                this.setState({
                                    edit: false
                                })
                            }).catch(e => {
                                this.setState({
                                    state: 'error',
                                    message: errorMessage(e)
                                })
                            })
                    }}
                    submitLabel="Save"
                >
                    <span
                        style={{
                            display: 'block',
                            float: 'right'
                        }}
                    >
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: false
                                })
                            }}
                        >✕</ShyButton>
                    </span>
                    <div className="form-group">
                        <label htmlFor='title'>Title</label>
                        <input
                            id="title"
                            type="text"
                            className="form-control"
                            defaultValue={title}
                            ref={ref => {
                                this.title = ref
                            }}
                            readOnly
                        />
                    </div>
                    <RadioButtons
                        ref={ref => {
                            this.goalStatus = ref
                        }}
                        id="goal-status"
                        label="Goal status"
                        defaultValue={goalStatus}
                        values={{
                            not: {
                                label: 'Not started',
                            },
                            doing: {
                                label: 'Working on it',
                            },
                            done: {
                                label: 'Achieved!',
                            },
                        }}
                    />
                </Form>
            :
                <span>
                    <span style={{
                        display: 'block',
                        float: 'right'
                    }}>
                        <DeleteModal
                            title="Delete goal?"
                            message="A deleted goal can't be recovered."
                            onDelete={remove}
                        />
                        <ShyButton
                            onClick={() => {
                                this.setState({
                                    edit: true
                                })
                            }}
                        >✎</ShyButton>
                    </span>
                    <span>{title}</span>
                    {goalStatus === 'done' && <span> ✔</span>}
                </span>
            }
        </li>
    }
}
const Goal = compose(
    SortableElement
)(GoalComponent)

