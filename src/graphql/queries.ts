import gql from "graphql-tag";


export const ME = gql`query {
    me {
        id
        name
        email
    }
}`

export const MY_ROOMS = gql`query {
    myRooms{
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

export const MY_ROOM = gql`query ($id: String!) {
    myRoom(id: $id) {
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

export const MESSAGES = gql`query ($roomId: String!) {
    messages(roomId: $roomId) {
        id
        content
        sender {
            id
            name
        }
        roomId
        createdAt
    }
}`