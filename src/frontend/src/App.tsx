import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useInitializeAccessControl, useGetCallerUserProfile, useGetCallerUserRole } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import Dashboard from './pages/Dashboard';
import LoadingScreen from './components/LoadingScreen';

function AuthenticatedContent() {
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  if (profileLoading || roleLoading) {
    return <LoadingScreen />;
  }

  if (profileFetched && userProfile === null) {
    return <ProfileSetupModal />;
  }

  return <Dashboard userRole={userRole} userProfile={userProfile} />;
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { isFetching: actorFetching } = useActor();

  // Runs once after login — registers the user in the backend RBAC system
  const { isSuccess: initialized, isLoading: initLoading } = useInitializeAccessControl();

  const isLoading = isInitializing || (isAuthenticated && (actorFetching || initLoading));

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            {!isAuthenticated ? (
              <div className="mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
                <div className="text-center">
                  <h1 className="mb-4 text-4xl font-bold tracking-tight">Welcome</h1>
                  <p className="mb-8 text-lg text-muted-foreground">
                    Please log in to access the application
                  </p>
                </div>
              </div>
            ) : initialized ? (
              <AuthenticatedContent />
            ) : (
              <div className="mx-auto px-4 py-8 text-center text-muted-foreground">
                Failed to initialize. Please refresh and try again.
              </div>
            )}
          </main>
          <Footer />
          <Toaster />
        </div>
      )}
    </ThemeProvider>
  );
}
