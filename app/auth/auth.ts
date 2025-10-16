// app/auth/auth.ts
import { authorize, refresh, AuthConfiguration } from 'react-native-app-auth';
import * as SecureStore from 'expo-secure-store';

// GitHub OAuth Configuration
const config: AuthConfiguration = {
  clientId: 'Ov23liL4h10yyWd9ta6l',
  redirectUrl: 'myapp://oauthredirect', // Must match app.json scheme
  scopes: ['read:user', 'user:email'],
  serviceConfiguration: {
    authorizationEndpoint: 'https://github.com/login/oauth/authorize',
    tokenEndpoint: 'https://github.com/login/oauth/access_token',
  },
  usePKCE: true, // Use PKCE for better security
  // additionalParameters: { allow_signup: 'true' },
};

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpirationDate?: string;
  idToken?: string;
  tokenType?: string;
}

export interface UserInfo {
  login: string;
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

// Sign in with GitHub OAuth
export async function signIn(): Promise<AuthTokens> {
  try {
    const result = await authorize(config);
    console.log('OAuth sign-in successful');
    
    // Store tokens securely
    await storeTokens(result);
    
    return result;
  } catch (err: any) {
    console.error('GitHub sign-in error', err);
    throw new Error(err.message || 'Failed to sign in with GitHub');
  }
}

// Refresh access token
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  try {
    const result = await refresh(config, {
      refreshToken: refreshToken,
    });
    
    // Update stored tokens
    const tokens: AuthTokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || undefined,
      accessTokenExpirationDate: result.accessTokenExpirationDate,
      idToken: result.idToken,
      tokenType: result.tokenType,
    };
    await storeTokens(tokens);
    
    return tokens;
  } catch (err: any) {
    console.error('Token refresh error', err);
    throw new Error('Failed to refresh token');
  }
}

// Store tokens securely
export async function storeTokens(tokens: AuthTokens): Promise<void> {
  try {
    await SecureStore.setItemAsync('authTokens', JSON.stringify(tokens));
  } catch (err) {
    console.error('Error storing tokens', err);
    throw new Error('Failed to store authentication tokens');
  }
}

// Retrieve stored tokens
export async function getStoredTokens(): Promise<AuthTokens | null> {
  try {
    const tokens = await SecureStore.getItemAsync('authTokens');
    return tokens ? JSON.parse(tokens) : null;
  } catch (err) {
    console.error('Error retrieving tokens', err);
    return null;
  }
}

// Get user info from GitHub API
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    const userInfo = await response.json();
    return userInfo;
  } catch (err) {
    console.error('Error fetching user info', err);
    throw err;
  }
}

// Sign out - clear stored tokens
export async function signOut(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('authTokens');
    console.log('Signed out successfully');
  } catch (err) {
    console.error('Error signing out', err);
    throw new Error('Failed to sign out');
  }
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const tokens = await getStoredTokens();
  if (!tokens) return false;
  
  // Check if token is expired
  if (tokens.accessTokenExpirationDate) {
    const expirationDate = new Date(tokens.accessTokenExpirationDate);
    if (expirationDate <= new Date()) {
      // Token expired, try to refresh
      if (tokens.refreshToken) {
        try {
          await refreshTokens(tokens.refreshToken);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }
  
  return true;
}
