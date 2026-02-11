import { useState, useEffect } from 'react';
import { UserProfile } from '../backend';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Save, User, Edit, X, Mail, FileText } from 'lucide-react';

interface ProfileTabProps {
  userProfile?: UserProfile | null;
}

export default function ProfileTab({ userProfile }: ProfileTabProps) {
  const [name, setName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [isEditing, setIsEditing] = useState(false);
  const saveProfile = useSaveCallerUserProfile();

  // Sync local state with userProfile prop changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      setBio(userProfile.bio || '');
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const profileData: UserProfile = {
        name: name.trim(),
        email: email.trim() || undefined,
        bio: bio.trim() || undefined,
      };
      
      await saveProfile.mutateAsync(profileData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile. Please try again.');
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setName(userProfile?.name || '');
    setEmail(userProfile?.email || '');
    setBio(userProfile?.bio || '');
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isEditing ? 'Edit your profile details' : 'View your profile details'}
              </CardDescription>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Name
              </div>
              <p className="text-base font-medium">{userProfile?.name || 'Not set'}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email
              </div>
              <p className="text-base">{userProfile?.email || 'Not set'}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Bio
              </div>
              <p className="text-base whitespace-pre-wrap">{userProfile?.bio || 'Not set'}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saveProfile.isPending}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saveProfile.isPending}
                placeholder="Enter your email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bio <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={saveProfile.isPending}
                placeholder="Tell us about yourself..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saveProfile.isPending} className="gap-2">
                {saveProfile.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saveProfile.isPending}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
