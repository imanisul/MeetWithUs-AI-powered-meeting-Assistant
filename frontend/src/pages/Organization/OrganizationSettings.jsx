import { useState, useEffect } from "react"
import { Building, Users, ShieldAlert, UserPlus, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { jwtDecode } from "jwt-decode"
import { organizationApi } from "@/services/organization.api"
import { usersApi } from "@/services/users.api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { AnimatedPage } from "@/components/layout/AnimatedPage"

export function OrganizationSettings() {
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")
  
  const token = localStorage.getItem("token")
  let currentUserRole = "GUEST"
  if (token) {
    try {
      const decoded = jwtDecode(token)
      currentUserRole = decoded.role
    } catch (e) {}
  }

  const isOrgAdmin = currentUserRole === "ORG_ADMIN" || currentUserRole === "SUPER_ADMIN"

  const { data: orgData, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization'],
    queryFn: organizationApi.getOrganization,
  })

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAllUsers,
  })

  const inviteMutation = useMutation({
    mutationFn: organizationApi.inviteMember,
    onSuccess: () => {
      toast.success("Member added to organization!")
      setInviteEmail("")
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to invite member")
    }
  })

  const roleMutation = useMutation({
    mutationFn: (variables) => organizationApi.updateRole(variables),
    onSuccess: () => {
      toast.success("Role updated!")
      queryClient.invalidateQueries({ queryKey: ['organization'] })
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role")
    }
  })

  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole })
  }

  const handleRoleChange = (memberId, newRole) => {
    roleMutation.mutate({ memberId, role: newRole })
  }

  const org = orgData?.data ? orgData.data : (orgData?.success ? null : orgData)
  const allUsers = usersData?.data ? usersData.data : (Array.isArray(usersData) ? usersData : [])

  if (isLoadingOrg) {
    return <div className="p-8 text-center text-muted-foreground">Loading workspace details...</div>
  }

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Building className="h-12 w-12 text-muted-foreground opacity-50" />
        <h2 className="text-2xl font-bold">No Workspace Found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You are not part of an organization. Please contact your administrator.
        </p>
      </div>
    )
  }

  return (
    <AnimatedPage className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
            <p className="text-muted-foreground">
              Manage your organization workspace, members, and roles.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Actions & Info */}
        <div className="space-y-6 md:col-span-1">
          {isOrgAdmin ? (
            <Card className="shadow-md border-border/50">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" /> Invite Member
                </CardTitle>
                <CardDescription>Add existing users to your workspace.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email address</label>
                    <Select value={inviteEmail} onValueChange={setInviteEmail}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user to invite" />
                      </SelectTrigger>
                      <SelectContent>
                        {allUsers.filter(u => !org.members.find(m => m.userId && m.userId.email === u.email)).map(user => (
                          <SelectItem key={user._id} value={user.email}>
                            {user.fullName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member (Can edit meetings & AI)</SelectItem>
                        <SelectItem value="GUEST">Guest (View only)</SelectItem>
                        <SelectItem value="ORG_ADMIN">Admin (Full access)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? "Inviting..." : "Add to Workspace"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  <ShieldAlert className="h-8 w-8 text-yellow-500" />
                  <h3 className="font-semibold text-yellow-500">Read-Only View</h3>
                  <p className="text-sm text-yellow-500/80">
                    You do not have administrative permissions to invite members or change roles.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">ORG_ADMIN:</span> Can manage members, settings, and full meeting/AI features.
                </div>
              </div>
              <div className="flex gap-2">
                <Users className="h-4 w-4 text-blue-500 shrink-0" />
                <div>
                  <span className="font-semibold">MEMBER:</span> Can access AI Chat, upload documents, and edit meeting notes.
                </div>
              </div>
              <div className="flex gap-2">
                <ShieldAlert className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <span className="font-semibold">GUEST:</span> View-only access to assigned meetings. AI capabilities restricted.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Member List */}
        <div className="md:col-span-2">
          <Card className="shadow-md border-border/50 h-full bg-card/95 backdrop-blur-sm">
            <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" /> Workspace Members
                </CardTitle>
                <CardDescription>People with access to this organization.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {org.members.length} Members
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">User</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {org.members.map((member) => {
                    if (!member.userId) return null;
                    return (
                    <TableRow key={member.userId._id || member.userId}>
                      <TableCell>
                        <div className="font-medium">{member.userId.fullName}</div>
                        <div className="text-xs text-muted-foreground">{member.userId.email}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {isOrgAdmin ? (
                          <Select 
                            defaultValue={member.role} 
                            onValueChange={(val) => handleRoleChange(member.userId._id, val)}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="GUEST">Guest</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={member.role === 'ORG_ADMIN' ? 'default' : 'outline'}>
                            {member.role}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AnimatedPage>
  )
}
