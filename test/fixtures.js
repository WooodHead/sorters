import {sleep, request} from './utils'

export const generateAndLogUser = async (page) => {
    await registerUser(page)
    await logUser(page)
}

export const registerUser = async (page) => {
    return await request(page, `http://localhost:3000/auth/local/register`, 'POST', {
        email: 'example@example.com',
        password: 'Somepass01',
    })
}

export const logUser = async (page) => {
    await request(page, `http://localhost:3000/auth/local/login`, 'POST', {
        username: 'example@example.com',
        password: 'Somepass01',
    });
    await request(page, `http://localhost:3000/auth/local/set-username`, 'POST', {
        username: 'test',
    });
}

export const setUserData = async (page) => {
    const res = await request(page, `http://localhost:3000/graphql`, 'POST', {
        query: `
            mutation (
                $profile: ProfileInput,
                $reading: String,
                $goalsDescription: String,
                $goal1: NewGoalInput!,
                $goal2: NewGoalInput!,
                $goal3: NewGoalInput!,
                $read1: NewReadInput!,
                $read2: NewReadInput!,
                $read3: NewReadInput!,
            ) {
                updateProfile(profile: $profile) {
                    _id
                }
                updateReading(reading: $reading) {
                    _id
                }
                updateGoalsDescription(goals: $goalsDescription) {
                    _id
                }
                goal1: createGoal(goal: $goal1) {
                    _id
                    title
                }
                goal2: createGoal(goal: $goal2) {
                    _id
                    title
                }
                goal3: createGoal(goal: $goal3) {
                    _id
                    title
                }
                read1: createRead(read: $read1) {
                    _id
                    title
                }
                read2: createRead(read: $read2) {
                    _id
                    title
                }
                read3: createRead(read: $read3) {
                    _id
                    title
                }
            }
        `,
        variables: {
            profile: {
                name: 'Test User',
                about: 'Test user about',
                bio: 'Test user bio',
                website: 'http://website',
                blog: 'http://blog',
                youtube: 'http://youtube',
                twitter: 'http://twitter',
                reddit: 'http://reddit',
                patreon: 'http://patreon',
                gender: 'male',
                city: 'Zurich',
                country: 'ch',
                selfAuthoringPast: true,
                selfAuthoringPresentVirtues: true,
                selfAuthoringPresentFaults: true,
                selfAuthoringFuture: true,
                understandMyself: true,
                agreeableness: 50,
                compassion: 50,
                politeness: 50,
                conscientiousness: 50,
                industriousness: 50,
                orderliness: 50,
                extraversion: 50,
                enthusiasm: 50,
                assertiveness: 50,
                neuroticism: 50,
                withdrawal: 50,
                volatility: 50,
                opennessToExperience: 50,
                intellect: 50,
                openness: 50,                    
            },
            reading: 'Test user reading',
            goalsDescription: 'Test user goals',
            read1: {
                title: 'Read',
            },
            read2: {
                title: 'Read - reading',
            },
            read3:{
                title: 'Read - read',
            },
            goal1: {
                title: 'Goal',
            },
            goal2: {
                title: 'Goal - doing',
            },
            goal3: {
                title: 'Goal - done',
            },
        },
    })
    const res2 = await request(page, 'http://localhost:3000/graphql', 'POST', {
        query: `
            mutation(
                $goal1: GoalInput!,
                $goal2: GoalInput!,
                $read1: ReadInput!,
                $read2: ReadInput!,
            ) {
                goal1: updateGoal(goal: $goal1) {
                    _id
                }
                goal2: updateGoal(goal: $goal2) {
                    _id
                }
                read1: updateRead(read: $read1) {
                    _id
                }
                read2: updateRead(read: $read2) {
                    _id
                }
            }
        `,
        variables: {
            read1: res.data.read2,
            read2: res.data.read3,
            goal1: res.data.goal2,
            goal2: res.data.goal3,
        }
    })
}


export async function getGoalIds(browserPage) {
    return (await request(browserPage, `http://localhost:3000/graphql`, 'POST', {
        query: `
            query {
                me {
                    goals {
                        _id
                    }
                }
            }
        `
    })).data.me.goals.map(goal => goal._id);
}
