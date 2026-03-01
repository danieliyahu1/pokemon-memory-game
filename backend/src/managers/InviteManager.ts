export interface GameInvite {
  inviteId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
}

class InviteManager {
  private invites: Map<string, GameInvite> = new Map();

  sendInvite(
    fromUserId: string,
    fromUsername: string,
    toUserId: string,
    toUsername: string
  ): string {
    const inviteId = `${fromUserId}-${toUserId}-${Date.now()}`;
    const invite: GameInvite = {
      inviteId,
      fromUserId,
      fromUsername,
      toUserId,
      toUsername,
      createdAt: new Date(),
      status: 'pending',
    };
    this.invites.set(inviteId, invite);
    console.log(`Invite sent: ${fromUsername} -> ${toUsername}`);
    return inviteId;
  }

  acceptInvite(inviteId: string): GameInvite | null {
    const invite = this.invites.get(inviteId);
    if (invite) {
      invite.status = 'accepted';
      return invite;
    }
    return null;
  }

  rejectInvite(inviteId: string): void {
    const invite = this.invites.get(inviteId);
    if (invite) {
      invite.status = 'rejected';
      this.invites.delete(inviteId);
    }
  }

  cancelInvite(inviteId: string): void {
    this.invites.delete(inviteId);
  }

  getInvite(inviteId: string): GameInvite | undefined {
    return this.invites.get(inviteId);
  }

  getPendingInvitesForUser(userId: string): GameInvite[] {
    const invites: GameInvite[] = [];
    for (const invite of this.invites.values()) {
      if (
        (invite.toUserId === userId && invite.status === 'pending') ||
        (invite.fromUserId === userId && invite.status === 'pending')
      ) {
        invites.push(invite);
      }
    }
    return invites;
  }

  getInvitesSentByUser(userId: string): GameInvite[] {
    const invites: GameInvite[] = [];
    for (const invite of this.invites.values()) {
      if (invite.fromUserId === userId && invite.status === 'pending') {
        invites.push(invite);
      }
    }
    return invites;
  }

  getInvitesReceivedByUser(userId: string): GameInvite[] {
    const invites: GameInvite[] = [];
    for (const invite of this.invites.values()) {
      if (invite.toUserId === userId && invite.status === 'pending') {
        invites.push(invite);
      }
    }
    return invites;
  }

  removeInvitesBySocketId(socketId: string): void {
    for (const [inviteId, invite] of this.invites.entries()) {
      // Remove invites for users who were actively in this socket
      // (When a session is cleaned up)
    }
  }
}

export default InviteManager;
