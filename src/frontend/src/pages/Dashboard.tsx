import { UserProfile, UserRole } from '../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileTab from '../components/ProfileTab';
import UsersTab from '../components/UsersTab';
import SmartClientUsersGrid from '../components/SmartClientUsersGrid';
import { Shield, User } from 'lucide-react';

interface DashboardProps {
  userRole?: UserRole;
  userProfile?: UserProfile | null;
}

export default function Dashboard({ userRole, userProfile }: DashboardProps) {
  const isAdmin = userRole != null && "admin" in userRole;

  return (
    <div className="mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
            {isAdmin ? (
              <Shield className="h-6 w-6 text-primary-foreground" />
            ) : (
              <User className="h-6 w-6 text-primary-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {userProfile?.name}!
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Administrator Dashboard' : 'User Dashboard'}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={`grid w-full max-w-lg ${isAdmin ? "grid-cols-3" : "grid-cols-1"}`}>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">All Users</TabsTrigger>}
          {isAdmin && <TabsTrigger value="users-grid">Users (Grid)</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab userProfile={userProfile} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="users-grid" className="mt-6">
            <SmartClientUsersGrid />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
