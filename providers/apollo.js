import withApollo from 'ooth-client-react-next-apollo'
import { IntrospectionFragmentMatcher } from 'react-apollo'
import settings from '../public-settings'

const introspectionQueryResultData = {
    __schema: {
        types: [
            {
                "kind": "INTERFACE",
                "name": "Event",
                "possibleTypes": [
                    {
                        "name": "UpdatedProfile",
                    },
                    {
                        "name": "UpdatedRead",
                    },
                    {
                        "name": "UpdatedGoal",
                    },
                ],
            },
        ],
    },
}

const fragmentMatcher= new IntrospectionFragmentMatcher({
    introspectionQueryResultData
})

export default withApollo({
    url: `${settings.url}/graphql`,
    opts: {
        fragmentMatcher,
    },
})