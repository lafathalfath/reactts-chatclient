import gql from "graphql-tag";


export const LOGIN = gql`mutation ($email: String!, $password: String!) {
    login(input: {email: $email, password: $password})
}`

export const LOGOUT = gql`mutation {
    logout
}`

export const REFRESH_AUTH = gql`mutation {
    refreshToken
}`

export const NEW_CHAT = gql`mutation ($email: String!) {
    createDM(email: $email) {
        id
        type
        name
        members {
        name
        email
        }
        createdAt
    }
}`

export const NEW_GROUP = gql`mutation ($name: String!, $membersEmail: [String!]!) {
    createGroup(input: {name: $name, membersEmail: $membersEmail}) {
        id
        type
        name
        members {
        name
        email
        }
        createdAt
    }
}`

export const SEND_MESSAGE = gql`mutation ($content: String!, $roomId: String!) {
    sendMessage(input: {content: $content, roomId: $roomId}) {
        id
        content
        sender {
            name
        }
        roomId
        createdAt
    }
}`