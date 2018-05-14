import {errorMessage} from '../utils/errors'

describe('error utils', () => {
    describe('errorMessage', () => {
        it('gets normal message', () => {
            expect(errorMessage(new Error('hello'))).toBe('hello')
        })

        it('gets grapqhl error message', () => {
            const error = new Error('hello')
            error.graphQLErrors = [{message: 'graphqlmessage'}]
            expect(errorMessage(error)).toBe('graphqlmessage')
        })
    })
})
