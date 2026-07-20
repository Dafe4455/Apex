// auth.ts
async jwt({ token, user }) {
  const now = Math.floor(Date.now() / 1000);

  if (user) {
    token.id = user.id;
    token.role = (user as any).role;
    token.firstName = (user as any).firstName;
    token.lastName = (user as any).lastName;
    token.lastActive = now;
    token.expired = false; // mark as fresh
    return token;
  }

  const lastActive = (token.lastActive as number) ?? now;
  
  if (now - lastActive > INACTIVITY_LIMIT_SECONDS) {
    // Instead of returning null, mark as expired
    // This keeps the token structure but signals it's dead
    token.expired = true;
    token.lastActive = now; // prevent repeated checks
    return token;
  }

  token.lastActive = now;
  token.expired = false;
  return token;
},

async session({ session, token }) {
  // If token is expired, return empty session (no throw)
  if (!token || token.expired) {
    return { expires: new Date(0).toISOString() } as any;
  }
  
  if (session.user) {
    (session.user as any).id = token.id;
    (session.user as any).role = token.role;
    (session.user as any).firstName = token.firstName;
    (session.user as any).lastName = token.lastName;
  }
  return session;
},
