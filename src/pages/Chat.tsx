import { useMutation, useQuery } from "@apollo/client/react"
import { useState } from "react"
import { MY_ROOMS } from '../graphql/queries';
import type { Room, User } from "../types";
import { LOGOUT } from "../graphql/mutations";
import NewChat from '../components/NewRoom';
import RoomView from "./Room";


export default function Chat({user}: {user: User}) {
    const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
    const [toggleNewChat, setToggleNewChat] = useState(false)

    const {
        data: roomData, 
        loading: roomLoading,
    } = useQuery<{myRooms: Room[]}>(MY_ROOMS)

    const activeRoom = roomData?.myRooms.find(r => r.id === activeRoomId)
    
    const [logout] = useMutation<{logout: boolean}>(LOGOUT, {
        onCompleted: () => {
            window.location.reload()
        }
    })

    const handleUnread = (data: {roomId: string, unreadCount: number}[]) => {
        data.forEach(item => {
            console.log(document.getElementById(`unread-${item.roomId}`))
        });
    }

    return <div className="h-dvh w-full bg-blue-900">

        <div className="h-full w-full">
            <div className="h-full flex">
                {roomLoading ? "Loading..." : 
                    <div className="w-1/5 h-full bg-gray-800">
                        <div className="flex items-center gap-3 p-3 border-b border-[#343f4f]">
                            <div className="w-10 h-10 rounded-full bg-gray-500"></div>
                            <div className="text-gray-200 text-lg font-bold">
                                {user.name}
                            </div>
                        </div>
                        <div className="w-full p-3">
                            <button className="cursor-pointer bg-yellow-600 rounded px-2" onClick={() => setToggleNewChat(!toggleNewChat)}>
                                + New Chat
                            </button>
                            {toggleNewChat && <div className="flex justify-center"><NewChat/></div>}
                        </div>
                        <ul className="text-white border-t border-[#343f4f]">
                            {roomData?.myRooms.map((r: Room) => (
                                <div key={r.id}>
                                    <li 
                                        className="flex items-center justify-between px-4 py-2 border-b border-[#343f4f] hover:bg-[#242f3f] cursor-pointer font-bold text-lg"
                                        onClick={() => setActiveRoomId(r.id)}
                                    >
                                        <div className="text-ellipsis overflow-hidden">
                                            {r.name || "DM"}
                                        </div>
                                        <div id={`unread-${r.id}`}>
                                            <div id="count" className="rounded-full bg-red-500 text-xs w-fit px-1.5 flex justify-center items-center">1</div>
                                        </div>
                                    </li>
                                </div>
                            ))}
                        </ul>
                    </div>
                }
                <div className="w-4/5 h-[calc(100%-35.8px)] flex flex-col justify-between">
                    <div>
                        <div className="cursor-pointer bg-slate-700 text-white flex items-center justify-between">
                            <button className="bg-red-600 hover:bg-red-700 px-4 py-2 font-semibold text-sm" onClick={() => {
                                logout()
                            }}>{'[<- LOGOUT'}</button>
                            <div>
                                {activeRoom && <div className="text-lg">{activeRoom.name}</div>}
                            </div>
                            <div>
                                {activeRoom && <button
                                    className="text-lg hover:bg-gray-800 px-4 py-1"
                                    onClick={() => {
                                        setActiveRoomId(null)
                                    }}
                                ><div className="rotate-45 font-bold text-xl">+</div></button>}
                            </div>
                        </div>
                    </div>
                    {activeRoomId && <RoomView
                        // key={activeRoomId}
                        roomId={activeRoomId} 
                        user={user}
                        onUnread={handleUnread}
                    />}
                </div>
            </div>
        </div>

        
    </div>
}