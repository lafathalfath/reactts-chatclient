import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloLink
} from "@apollo/client"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { getMainDefinition } from "@apollo/client/utilities"
import { createClient } from "graphql-ws"


const httpLink = new HttpLink({
    uri: 'http://localhost:8080/query',
    credentials: "include"
})

const wsLink = new GraphQLWsLink(
    createClient({
        url: "ws://localhost:8080/query",
        on: {
            connected: () => console.log("WS connected"),
            closed: () => console.log("WS closed"),
            error: (err) => console.error("WS error", err),
        },
    })
)

const splitLink = ApolloLink.split(
    ({query}) => {
        const def = getMainDefinition(query)
        return (
            def.kind === "OperationDefinition" && def.operation === "subscription"
        )
    },
    wsLink,
    httpLink
)

export const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
        typePolicies: {
            Message: {
                keyFields: ["id"],
            },
            Query: {
                fields: {
                messages: {
                    keyArgs: ["roomId"], // 🔥 WAJIB
                    merge(_existing = [], incoming) { return incoming },
                },
                },
            },
        },
    }),
})