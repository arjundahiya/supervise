"use client";

import { authClient } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner"
import StudentDashboard from "./components/student-dashboard";
import { redirect, RedirectType } from 'next/navigation'


export default function Dashboard() {
const { 
        data: session, 
        isPending, //loading state
        error, //error object
        refetch //refetch the session
    } = authClient.useSession() 
    if(isPending){
        return(
            <div className="flex flex-row min-h-screen justify-center items-center">
                <Spinner className="size-20"/>
            </div>
        )
    }
    if (!session){
        redirect("/", RedirectType.replace)
    }
    if (session){
        return(
            <StudentDashboard name={session.user.name}/>
        )
    }
}