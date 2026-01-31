import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { SEND_MESSAGE } from "../graphql/mutations";


export default function MessageInput({roomId}: {roomId: string}) {
    const [text, setText] = useState("")
    const [send] = useMutation(SEND_MESSAGE)

    return <div>
        <input placeholder="Type Here..." value={text} onChange={e => setText(e.target.value)} />
        <button onClick={() => {
            send({
                variables: {
                    roomId, content: text
                }
            })
            setText("")
        }}>
            Send
        </button>
    </div>
}