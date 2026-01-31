import { useMutation } from "@apollo/client/react";
import { LOGIN } from "../graphql/mutations";
import { useState } from "react";


export default function Login() {
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const [cred, setCred] = useState<{email: string, password: string}>({
        email: "",
        password: ""
    })
    const [login] = useMutation(LOGIN, {
        onCompleted() {
            window.location.reload()
        },
    })

    return <div className="flex items-center justify-center flex-col w-full h-screen">
        <div className="w-78 flex items-center justify-center bg-red-500">
            <h2 className="text-center text-xl font-bold p-5">Login</h2>
        </div>
        <form 
            className="flex flex-col items-center justify-center gap-2 p-5 bg-zinc-100 w-78 h-48"
            onSubmit={(e) => {
                e.preventDefault()
                login({
                    variables: {
                        email: cred.email,
                        password: cred.password
                    }
                })
            }}
        >
            <input required className="border rounded border-zinc-400" name="email" placeholder="Email" value={cred.email} onChange={(e) => setCred({...cred, [e.target.name]: e.target.value})}/>
            <input required className="border rounded border-zinc-400" type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={cred.password} onChange={(e) => setCred({...cred, [e.target.name]: e.target.value})}/>
            <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "hide password" : "show password"}</button>
            <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 cursor-pointer px-3 py-1 rounded text-white"
            >
                Login
            </button>    
        </form>
    </div>
}