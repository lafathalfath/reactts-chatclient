import gql from "graphql-tag"


export const MESSAGE_SUBS = gql`subscription ($roomId: String!) {
    messageReceived(roomId: $roomId) {
        id
        content
        sender {
            name
        }
        roomId
        createdAt
    }
}`

export const TYPING_SUBS = gql`subscription ($roomId: String!) {
    userTyping(roomId: $roomId) {
        roomId
        user {
            id
            name
            email
        }
        typing
    }
}`