import { useSupabaseClient } from '@supabase/auth-helpers-react';

export default function Login() {
  const supabase = useSupabaseClient();

  const handleLogin = async (provider: 'google' | 'github' | 'facebook') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) console.error('Error:', error);
  };

  return (
    <div>
      <button onClick={() => handleLogin('google')}>Login with Google</button>
      <button onClick={() => handleLogin('github')}>Login with GitHub</button>
      <button onClick={() => handleLogin('facebook')}>Login with Facebook</button>
    </div>
  );
}