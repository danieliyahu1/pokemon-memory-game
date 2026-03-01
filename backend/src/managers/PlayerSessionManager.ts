export interface PlayerSession {
  userId: string;
  username: string;
  socketId: string;
  loginTime: Date;
  lastActivity: Date;
}

class PlayerSessionManager {
  private sessions: Map<string, PlayerSession> = new Map();

  addSession(userId: string, username: string, socketId: string): void {
    const session: PlayerSession = {
      userId,
      username,
      socketId,
      loginTime: new Date(),
      lastActivity: new Date(),
    };
    this.sessions.set(userId, session);
    console.log(`Player session added: ${username} (${socketId})`);
  }

  removeSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      this.sessions.delete(userId);
      console.log(`Player session removed: ${session.username}`);
    }
  }

  removeSessionBySocketId(socketId: string): void {
    for (const [userId, session] of this.sessions.entries()) {
      if (session.socketId === socketId) {
        this.sessions.delete(userId);
        console.log(`Player session removed: ${session.username}`);
        return;
      }
    }
  }

  getSession(userId: string): PlayerSession | undefined {
    return this.sessions.get(userId);
  }

  getSessionBySocketId(socketId: string): PlayerSession | undefined {
    for (const session of this.sessions.values()) {
      if (session.socketId === socketId) {
        return session;
      }
    }
    return undefined;
  }

  searchPlayers(username: string): PlayerSession[] {
    const results: PlayerSession[] = [];
    for (const session of this.sessions.values()) {
      if (
        session.username.toLowerCase().includes(username.toLowerCase())
      ) {
        results.push(session);
      }
    }
    return results;
  }

  getOnlinePlayers(): PlayerSession[] {
    return Array.from(this.sessions.values());
  }

  updateLastActivity(userId: string): void {
    const session = this.sessions.get(userId);
    if (session) {
      session.lastActivity = new Date();
    }
  }

  isPlayerOnline(userId: string): boolean {
    return this.sessions.has(userId);
  }
}

export default PlayerSessionManager;
