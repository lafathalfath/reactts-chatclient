import { useMutation } from "@apollo/client/react"
import { useState } from "react"
import { NEW_CHAT } from "../graphql/mutations"


export default function NewChat() {

    const [email, setEmail] = useState<string>("")
    
    const [newChat] = useMutation(NEW_CHAT, {
        onCompleted() {
            window.location.reload()
        },
    })

    return <div className="flex items-center gap-1 w-full">
        <input className="border bg-gray-800 text-white border-zinc-300 rounded w-full" placeholder="email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)}/>
        <button className="bg-green-500 px-2 py-1 rounded text-sm"
            onClick={() => {
                newChat({
                    variables: {email}
                })
            }}
        >Create</button>
    </div>
}