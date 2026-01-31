import { createContext, useContext, useEffect, useState } from "react"
import { useMutation, useQuery } from '@apollo/client/react';
import type { User } from "../types"
import { ME } from "../graphql/queries";
import { REFRESH_AUTH } from "../graphql/mutations";

type AuthContextType = {
    user: User | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

export const AuthProvider = ({children}: any) => {
    const {data, loading, error} = useQuery<{me: User}>(ME)
    const [user, setUser] = useState<User | null>(null)

    const [refresh] = useMutation<{refreshToken: boolean}>(REFRESH_AUTH, {
        onCompleted: ({refreshToken}) => {
            if (!refreshToken) {
                setUser(null)
                return
            }
            window.location.reload()
        }
    })

    useEffect(() => {
        if (data?.me) {
            setUser(data.me)
        }
        if (error) {
            refresh()
        }
    }, [data, error])
    return <AuthContext.Provider value={{user, loading}}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)