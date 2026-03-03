// app/admin/users/page.tsx
import { getUsersCount } from '@/lib/actions/admin/user-actions'
import { requireSession } from '@/lib/auth/session'
import { UsersClient } from './users-client'

export default async function UsersPage() {
    const usersCount = await getUsersCount()
    const newInstallation = usersCount === 0
    console.log('users count', usersCount, 'new installation?', newInstallation)
    if (!newInstallation) {
        await requireSession('/admin/users')
    }

    return <UsersClient newInstallation={newInstallation} />
}
