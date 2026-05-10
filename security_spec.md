# Security Specification for XeJesUs

## Data Invariants
1. **Users**: Users can only read and write their own profile.
2. **Inquiries**: Only the creator of an inquiry can read or write it (unless explicitly shared in a group discussion).
3. **Groups**: Only members can read group details. Only owners can update or delete groups.
4. **Members**: Only group owners can add/remove members. Members can leave.
5. **Discussions**: Only group members can read and create discussions.
6. **Messages**: Only group members can read and create messages.

## The Dirty Dozen Payloads (Target: DENY)
1. Creating a group with a different `ownerId`.
2. Updating an inquiry's `userId`.
3. Reading an inquiry belonging to another user.
4. Joining a group by writing to `/groups/{groupId}/members/{userId}` directly (should only be allowed by owner or invite). *Note: For this app, we'll allow public joining for now or owner-only, let's go with owner-only for invitations.*
5. Creating a discussion in a group the user is not a member of.
6. Updating a message text by someone who isn't the author.
7. Injecting a 2MB string into an inquiry `query`.
8. Deleting a group as a non-owner.
9. Changing the `createdAt` timestamp of a message.
10. Listing all inquiries in the system without a `userId` filter.
11. Accessing PII of other users from the `users` collection.
12. Creating an inquiry with a fake `inquiryId` that is too long.

## Proposed Rules Logic
- `isValidId(id)`: Standard ID validation.
- `isSignedIn()`: Standard auth check.
- `isOwner(userId)`: `request.auth.uid == userId`.
- `isGroupMember(groupId)`: `exists(/databases/$(database)/documents/groups/$(groupId)/members/$(request.auth.uid))`.
- `isGroupOwner(groupId)`: `get(/databases/$(database)/documents/groups/$(groupId)).data.ownerId == request.auth.uid`.
