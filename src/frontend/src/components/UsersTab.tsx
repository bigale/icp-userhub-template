import { useGetAllUserProfiles, useAssignUserRole } from '../hooks/useQueries';
import { UserRole } from '../backend';

const roleFromString = (s: string): UserRole => {
  if (s === "admin") return { admin: null };
  if (s === "user") return { user: null };
  return { guest: null };
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Shield, User as UserIcon } from 'lucide-react';
import { Principal } from '@dfinity/principal';

export default function UsersTab() {
  const { data: allProfiles, isLoading } = useGetAllUserProfiles();
  const assignRole = useAssignUserRole();

  const handleRoleChange = async (userPrincipal: Principal, newRole: UserRole) => {
    try {
      await assignRole.mutateAsync({ user: userPrincipal, role: newRole });
      toast.success('User role updated successfully!');
    } catch (error) {
      toast.error('Failed to update user role. Please try again.');
      console.error('Role update error:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage all users in the system ({allProfiles?.length || 0} users)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!allProfiles || allProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Principal ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allProfiles.map(([principal, profile]) => (
                  <TableRow key={principal.toString()}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                        {profile.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {principal.toString().slice(0, 20)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Role
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select
                        onValueChange={(value) =>
                          handleRoleChange(principal, roleFromString(value))
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Change role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
