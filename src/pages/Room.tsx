import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { Message, Room, TypingEvent, User } from "../types"
import { useMutation, useQuery, useSubscription } from "@apollo/client/react"
import { MESSAGES, MY_ROOM } from "../graphql/queries"
import { SEND_MESSAGE, TYPING } from "../graphql/mutations"
import { MESSAGE_SUBS, TYPING_SUBS } from "../graphql/subscriptions"

function isNearBottom(el: HTMLUListElement, offset = 120): boolean {
    return el.scrollHeight - el.scrollTop - el.clientHeight < offset
}

function extractTime(dateTime: string | null): string | null {
    if (!dateTime) return null
    const date = new Date(dateTime)
    return date.toTimeString().slice(0, 5)   
}

function daysName(number: number): string {
    let dayNum = number
    if (number < 0) dayNum = 7 + number
    switch (dayNum) {
        case 0:
            return "Sunday"
        case 1:
            return "Monday"
        case 2:
            return "Tuesday"
        case 3:
            return "Wednesday"
        case 4:
            return "Thursday"
        case 5:
            return "Friday"
        case 6:
            return "Saturday"
        default:
            return "";
    }
}

function extractDate(dateTime: string | null): string | null {
    if (!dateTime) return null
    const now = new Date().toISOString()
    const nowDate = new Date(now.slice(0, 10))
    const targetDate = new Date(dateTime.slice(0, 10))
    
    if (nowDate.getFullYear() - targetDate.getFullYear() > 0) return `${targetDate.getDate()}/${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`
    if (nowDate.getMonth() - targetDate.getMonth() > 1) return `${targetDate.getDate()}/${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`
    let diff = (nowDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)

    if (diff == 0) return "Today";
    if (diff == 1) return "Yesterday"
    if (diff < 7) return `${(daysName(nowDate.getDay() - diff))}`;
    return `${targetDate.getDate()}/${targetDate.getMonth() + 1}/${targetDate.getFullYear()}`;
}

function isPrevSameDay(current: string | null, target: string | null): boolean {
    if (!current || !target) return false
    const now = new Date(current).getDay()
    const targetDay = new Date(target).getDay()
    return now == targetDay
}

const typingDelay = 500

export default function RoomView({roomId, user, onUnread}: {roomId: string, user: User, onUnread: any}) {
    const [text, setText] = useState<string>("")
    const [scrollBtn, setScrollBtn] = useState<boolean>(false)
    const [animateScroll, setAimateScroll] = useState<boolean>(false)
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [isTyping, setIsTyping] = useState<boolean>(false)
    const [usersTyping, setUsersTyping] = useState<TypingEvent[]>([])

    const {data: roomData} = useQuery<{myRoom: Room}>(MY_ROOM, {
        variables: {id: roomId}
    })
    const room = roomData?.myRoom

    const listRef = useRef<HTMLUListElement>(null)
    const shouldAutoScrollRef = useRef<boolean>(true)
    const lastReadMessageIdRef = useRef<string | null>(null)
    const typingTimeoutRef = useRef<number | null>(null)

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

    const [typing] = useMutation<{typing: TypingEvent}>(TYPING)
    
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
            if (!shouldAutoScrollRef.current) {
                setUnreadCount(c => c + 1)
                onUnread((d: {roomId: string, unreadCount: number}[]) => [...d, {roomId: roomId, unreadCount: unreadCount}])
            }
        }
    })

    useSubscription<{userTyping: TypingEvent}>(TYPING_SUBS, {
        variables: {roomId: roomId},
        skip: !roomId,
        onData({data}) {
            const typ = data.data?.userTyping
            if (typ) {
                const isExists: boolean = usersTyping.filter(t => {return t.roomId == typ.roomId && t.user?.id == typ.user?.id}).length > 0
                if (typ.user?.id != user.id && typ.typing && !isExists) {
                    setUsersTyping([...usersTyping, typ])
                } else if (typ.typing == false) {
                    const filter = usersTyping.filter(i => {return i.user?.id != typ.user?.id})
                    setUsersTyping(filter)
                }
            }
        },
    })


    useLayoutEffect(() => {
        if (shouldAutoScrollRef.current) {
            requestAnimationFrame(() => toBottom())
            setUnreadCount(0)
        }
    }, [msgData?.messages.length, msgLoading, usersTyping.length])

    const handleScroll = () => {
        const el = listRef.current
        if (!el) return
        const nearBottom = isNearBottom(el)
        shouldAutoScrollRef.current = nearBottom
        if (nearBottom) {
            setScrollBtn(false)
            !animateScroll && setAimateScroll(true)
            const last = msgData?.messages.at(-1)
            if (last) lastReadMessageIdRef.current = last.id
        }
        else setScrollBtn(true)
    }

    const toBottom = () => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: animateScroll ? "smooth" : "instant"
            // behavior: "smooth"
        })
        setScrollBtn(false)
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value)
        setIsTyping(true)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false)
        }, typingDelay)
    }

    useEffect(() => {
        typing({variables: {
            roomId: roomId,
            isTyping: isTyping
        }})
    }, [isTyping])

    return <div className="h-full">
        {roomId && <div className="h-full">
                <ul 
                    ref={listRef} 
                    onScroll={handleScroll}
                    className="py-2 h-[calc(100dvh-6.5rem)] overflow-hidden overflow-y-scroll [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full"
                >
                    {msgData?.messages.map((m: Message, i: number) => (
                        <li key={m.id} className={`my-1 px-3 flex flex-col ${m.sender?.id == user.id && 'items-end'}`}>
                            {
                                (i == 0 || !isPrevSameDay(m.createdAt, msgData.messages[i-1].createdAt)) && 
                                <div className="w-full flex justify-center py-1">
                                    <div className="bg-gray-600 text-white text-sm rounded px-2 py-1">{extractDate(m.createdAt)}</div>
                                </div>
                            }
                            {
                                i == msgData.messages.length - unreadCount &&
                                <div className="relative w-full flex justify-center my-1 py-0.5">
                                    <div className="z-10 bg-yellow-600 text-white text-xs rounded-full px-2 py-0.5">
                                        Unread
                                    </div>
                                    <div className="absolute top-1/2 w-full bg-amber-400 h-[0.25px]"></div>
                                </div>
                            }
                            {
                                room?.type == "group" && 
                                (i == 0 || 
                                    (i > 0 && msgData.messages[i-1]?.sender?.id != m.sender?.id) ||
                                    !isPrevSameDay(m.createdAt, msgData.messages[i-1].createdAt)
                                ) && 
                                <b>{m.sender?.id == user.id ? "You" : m.sender?.name ?? "Unknown"}:</b>
                            }
                            <div 
                                className={`text-wrap truncate px-2 py-1 rounded w-fit max-w-3/4 overflow-hidden flex flex-col ${
                                    m.sender?.id == user.id ? 
                                    m.optimistic ? 'items-end bg-green-600 opacity-70' : 'items-end bg-green-600' 
                                    :'bg-white text-gray-800'
                                }`}
                            >
                                <div>{m.content}</div>
                                <div className="text-xs opacity-40">{extractTime(m.createdAt)}</div>
                            </div>
                        </li>
                    ))}
                    {usersTyping.map((typ) => (
                        <li key={typ.user?.id} className="my-1 px-3 flex flex-col">
                            {room?.type == "group" && <b>{typ.user?.name ?? "Unknown"}:</b>}
                            <div className="px-2 py-1 rounded w-fit bg-white text-gray-800">
                                <span className="loading loading-dots loading-md"></span>
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
                        <input 
                            type="text" 
                            placeholder="Type Here..." 
                            className="px-3 py-1 w-full rounded-full border border-zinc-400 text-white outline-0" 
                            autoFocus 
                            value={text} 
                            onChange={handleInput}
                        />
                    </div>
                    <button type="submit" disabled={text == ""} className="bg-green-700 rounded-full text-white font-bold text-xl p-[0.1rem]">
                        <div className="bg-green-800 hover:bg-green-700 rounded-full py-1 px-2">
                            {'->'}
                        </div>
                    </button>
                </form>
            </div>
            {scrollBtn && 
                <div className="absolute bottom-18 right-3">
                    <button 
                        className="relative bg-gray-800 text-white opacity-85 rounded-full h-10 w-10 overflow-hidden text-sm"
                        onClick={toBottom}
                    >
                        <div className="rotate-90 relative">
                            <div>{'->'}</div>
                        </div>
                    </button>
                    {unreadCount > 0 && <span className="absolute top-0 right-0 bg-red-500 rounded-full text-white text-xs w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
                </div>
            }
        </div>}
    </div>
}