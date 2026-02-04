import type { NewUser } from "../../types"
import { useMutation } from "@apollo/client/react"
import { REGISTER } from "../../graphql/mutations"
import React, { useState } from "react"


export default function Register({onToRegister}: {onToRegister: any}) {
    const [userData, setUserData] = useState<NewUser>({
        name: "",
        email: "",
        password: "",
        passwordConfirmation: ""
    })
    const [showPassword, setShowPassword] = useState<boolean>(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserData({
            ...userData,
            [e.target.name]: e.target.value
        })
    }

    const [register] = useMutation(REGISTER, {
        onCompleted() {
            onToRegister(false)
        }
    })

    return <div className="flex items-center justify-center flex-col w-full h-screen">
        <div className="w-78 flex items-center justify-center bg-red-500">
            <h2 className="text-center text-xl font-bold p-5">Register</h2>
        </div>
        <form 
            className="flex flex-col items-center justify-center gap-2 p-5 bg-zinc-100 w-78 text-gray-800"
            onSubmit={(e) => {
                e.preventDefault()
                register({
                    variables: userData
                })
            }}
        >
            <input required className="border rounded border-zinc-400" type="text" name="name" placeholder="Username" value={userData.name} onChange={handleChange}/>
            <input required className="border rounded border-zinc-400" type="email" name="email" placeholder="Email" value={userData.email} onChange={handleChange}/>
            <input required className="border rounded border-zinc-400" type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={userData.password} onChange={handleChange}/>
            <input required className="border rounded border-zinc-400" type={showPassword ? "text" : "password"} name="passwordConfirmation" placeholder="Confirm Password" value={userData.passwordConfirmation} onChange={handleChange}/>
            <button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "hide password" : "show password"}</button>
            <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 cursor-pointer px-3 py-1 rounded text-white"
            >
                Register
            </button>
            <div className="relative w-full flex items-center justify-center text-sm text-gray-400">
                <div className="z-10">or</div>
                <div className="absolute top-1/2 w-full h-[0.15px] bg-gray-400"></div>
            </div>
            <button className="text-sm text-gray-400" onClick={() => onToRegister()}>Login</button>
        </form>
    </div>
}