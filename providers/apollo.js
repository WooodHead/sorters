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
                        "name": "UpdatedValue",
                    },
                    {
                        "name": "UpdatedProfile",
                    },
                    {
                        "name": "UpdatedRead",
                    },
                    {
                        "name": "UpdatedGoal",
                    },
                    {
                        "name": "UpdatedTopic",
                    },
                    {
                        "name": "UpdatedEntry",
                    },
                    {
                        "name": "UpdatedEssay"
                    },
                    {
                        "name": "UpdatedSpeech",
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