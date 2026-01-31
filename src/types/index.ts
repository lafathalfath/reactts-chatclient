export type User = {
    id: string | null
    name: string | null
    email: string | null
    rooms: Room[] | null
    password: string | null
}

export type Room = {
    id: string | null
    type: string | null
    name: string | null
    members: User[] | null
    createdAt: string | null
}

export type Message = {
    id: string | null
    content: string | null
    sender: User | null
    roomId: string | null
    createdAt: string | null
    optimistic?: boolean
}