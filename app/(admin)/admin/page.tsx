// app/admin/page.tsx
import { AdminContent } from '@/components/admin/admin-content'
import { getUsersCount } from '@/lib/actions/admin/user-actions'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
    const usersCount = await getUsersCount()
    const newInstallation = usersCount === 0

    if (!newInstallation) {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session) redirect('/admin/login')
    }

    return (
        <div className="p-8">
            <AdminContent newInstallation={newInstallation} />
        </div>
    )
}