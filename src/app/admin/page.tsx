import AdminDashboard from "./components/admin-dashboard";
import { redirect } from 'next/navigation';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Dashboard() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        return redirect("/");
    }

    const user = session.user;

    if (user.role === "STUDENT") {
        return redirect("/dashboard");
    }
    
    if (user.role === "ADMIN") {
        return <AdminDashboard />;
    }

    return (
        <div className="p-10 text-center">
            <h1 className="text-xl font-bold">Account Setup Required</h1>
            <p>You are logged in, but have no role assigned.</p>
        </div>
    );
}