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