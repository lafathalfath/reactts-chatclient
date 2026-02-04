import { useState } from "react";
import Register from "./Register";
import Login from "./Login";


export default function Authentication() {
    const [registerPage, setRegisterPage] = useState<boolean>(false)
    
    if (registerPage) return <Register onToRegister={() => setRegisterPage(false)}/> 
    return<Login onToRegister={() => setRegisterPage(true)}/>
}