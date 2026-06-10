import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from '@/components/ui/sonner'
import { MemberActions } from './member-actions'
import { InviteForm } from './invite-form'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  if (!adminEmails.includes(user.email ?? '')) redirect('/projects')

  const admin = createAdminClient()
  const { data: { users }, error } = await admin.auth.admin.listUsers()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold text-foreground">Members</h1>
          </div>
        </div>

        {/* Invite form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Invite a member</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>

        {/* Members list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {users?.length ?? 0} {users?.length === 1 ? 'member' : 'members'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {error && (
              <p className="text-sm text-red-500 px-6 py-4">Failed to load users: {error.message}</p>
            )}
            {users && users.length > 0 && (
              <ul className="divide-y divide-border">
                {users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Joined {new Date(u.created_at).toLocaleDateString()}
                        {u.last_sign_in_at && (
                          <> · Last login {new Date(u.last_sign_in_at).toLocaleDateString()}</>
                        )}
                        {!u.last_sign_in_at && <> · Invite pending</>}
                      </p>
                    </div>
                    {u.id !== user.id && (
                      <MemberActions userId={u.id} email={u.email ?? ''} />
                    )}
                    {u.id === user.id && (
                      <span className="text-xs text-muted-foreground italic">You</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  )
}
