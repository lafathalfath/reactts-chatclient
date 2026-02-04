import gql from "graphql-tag";


export const REGISTER = gql`mutation ($name: String!, $email: String!, $password: String!, $passwordConfirmation: String!) {
    createUser(input: {name: $name, email: $email, password: $password, passwordConfirmation: $passwordConfirmation}) {
        id
    }
}`

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

export const TYPING = gql`mutation ($roomId: String!, $isTyping: Boolean!) {
    typing(roomId: $roomId, isTyping: $isTyping)
}`