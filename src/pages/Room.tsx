import { useLayoutEffect, useRef, useState } from "react"
import type { Message, Room, User } from "../types"
import { useMutation, useQuery, useSubscription } from "@apollo/client/react"
import { MESSAGES, MY_ROOM } from "../graphql/queries"
import { SEND_MESSAGE } from "../graphql/mutations"
import { MESSAGE_SUBS } from "../graphql/subscriptions"

function isNearBottom(el: HTMLUListElement, offset = 120): boolean {
    return el.scrollHeight - el.scrollTop - el.clientHeight < offset
}

function extractTime(dateTime: string | null): string | null {
    if (!dateTime) return null
    const date = new Date(dateTime)
    // const currentDate = new Date(Date())
    const hour = date.getDay()
    return hour.toString()
    
}

export default function RoomView({roomId, user}: {roomId: string, user: User}) {
    const [text, setText] = useState<string>("")
    const [scrollBtn, setScrollBtn] = useState<boolean>(false)
    const [unreadCount, setUnreadCount] = useState<number>(0)

    const {data: roomData} = useQuery<{myRoom: Room}>(MY_ROOM, {
        variables: {id: roomId}
    })
    const room = roomData?.myRoom

    const listRef = useRef<HTMLUListElement>(null)
    const shouldAutoScrollRef = useRef<boolean>(true)
    const lastReadMessageIdRef = useRef<string | null>(null)

    function handleScroll() {
        const el = listRef.current
        if (!el) return
        const nearBottom = isNearBottom(el)
        shouldAutoScrollRef.current = nearBottom
        if (nearBottom) {
            setScrollBtn(false)
            setUnreadCount(0)
            const last = msgData?.messages.at(-1)
            if (last) lastReadMessageIdRef.current = last.id
        }
        else setScrollBtn(true)
    }

    const {
        data: msgData, 
        loading: msgLoading
    } = useQuery<{messages: Message[]}>(MESSAGES, {
        variables: {roomId},
        skip: !roomId,
        fetchPolicy: "cache-first",
        nextFetchPolicy: "cache-first"
    })
    
    const [sendMessage] = useMutation<{sendMessage: Message}>(SEND_MESSAGE, {
        optimisticResponse: ({roomId, content}) => {
            return {sendMessage: {
                __typename: "Message",
                id: `temp-${crypto.randomUUID()}`,
                content,
                roomId,
                createdAt: new Date().toISOString(),
                optimistic: true,
                sender: {
                    __typename: "User",
                    id: user.id,
                    name: user.name,
                    email: null,
                    password: null,
                    rooms: null
                }
            }}
        },
        onCompleted() {
            setText('')
        },
        update(cache, { data }) {
            const msg = data?.sendMessage
            if (!msg) return
            cache.modify({
                fields: {
                messages(existingRefs = [], { storeFieldName, toReference, readField }) {
                    if (!storeFieldName.includes(`"roomId":"${roomId}"`)) return existingRefs
                    const ref = toReference(msg, true)
                    if (existingRefs.some((r: any) => readField("id", r) === msg.id)) return existingRefs
                    shouldAutoScrollRef.current = true
                    return [...existingRefs, ref]
                }
                }
            })
        }
    })

    
    useSubscription<{messageReceived: Message}>(MESSAGE_SUBS, {
        variables: { roomId: roomId },
        skip: !roomId,
        onData({ client, data }) {
            const newMsg = data.data?.messageReceived
            if (!newMsg) return
            if (newMsg.sender?.id == user.id) return
            client.cache.modify({
                fields: {
                    messages(existingRefs = [], { storeFieldName, toReference, readField }) {
                        if (!storeFieldName.includes(`"roomId":"${roomId}"`)) return existingRefs
                        if (existingRefs.some((r: any) => readField("id", r) === newMsg.id)) return existingRefs
                        return [...existingRefs, toReference(newMsg, true)]
                    }
                }
            })
            if (!shouldAutoScrollRef.current) setUnreadCount(c => c + 1)
        }
    })

    useLayoutEffect(() => {
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => toBottom())
            setUnreadCount(0)
        }
    }, [msgData?.messages.length, msgLoading])

    const toBottom = () => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth"
        })
        setScrollBtn(false)
    }

    return <div className="h-full">
        {roomId && <div className="h-full">
                <ul 
                    ref={listRef} 
                    onScroll={handleScroll}
                    className="py-2 h-[calc(100%-66px)] overflow-hidden overflow-y-scroll [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                    {msgData?.messages.map((m: Message, i: number) => (
                        <li key={m.id} className={`my-1 px-3 flex flex-col ${m.sender?.id == user.id && 'items-end'}`}>
                            {room?.type == "group" && (i == 0 || (i > 0 && msgData.messages[i-1]?.sender?.id != m.sender?.id)) && 
                                <b>{m.sender?.id == user.id ? "You" : m.sender?.name ?? "Unknown"}:</b>
                            }
                            <div 
                                className={`text-wrap truncate px-2 py-1 rounded w-fit max-w-3/4 overflow-hidden flex flex-col ${
                                    m.sender?.id == user.id ? 
                                    m.optimistic ? 'items-end bg-green-600 opacity-70' : 'items-end bg-green-600' 
                                    :'bg-white'
                                }`}
                            >
                                <div>{m.content}</div>
                                <div className="text-xs opacity-40">{extractTime(m.createdAt)}</div>
                            </div>
                        </li>
                    ))}
                </ul>
            
            <div className="w-full p-3">
                <form 
                className="w-full flex items-center gap-2"
                onSubmit={e => {
                    e.preventDefault()
                    text != "" && sendMessage({ variables: {
                        roomId: roomId,
                        content: text
                    }})
                }}>
                    <div className="w-full bg-gray-700 rounded-full p-1">
                        <input type="text" placeholder="Type Here..." className="px-3 py-1 w-full rounded-full border border-zinc-400 text-white outline-0" autoFocus value={text} onChange={e => setText(e.target.value)}/>
                    </div>
                    <button type="submit" disabled={text == ""} className="bg-green-700 rounded-full text-white font-bold text-xl p-[0.1rem]">
                        <div className="bg-green-800 hover:bg-green-700 rounded-full py-1 px-2">
                            {'->'}
                        </div>
                    </button>
                </form>
            </div>
            <div className="absolute bottom-18 right-3">
                {scrollBtn && <button 
                    className="relative bg-gray-800 text-white opacity-85 rounded-full h-10 w-10 overflow-hidden text-sm"
                    onClick={toBottom}
                >
                    <div className="rotate-90 relative">
                        <div>{'->'}</div>
                    </div>
                </button>}
                {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 rounded-full text-white text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
            </div>
        </div>}
    </div>
}