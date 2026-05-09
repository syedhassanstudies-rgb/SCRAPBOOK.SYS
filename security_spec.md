# Security Specification - SCRAPBOOK.SYS

## 1. Data Invariants
- A scrapbook piece must belong to the user who created the page.
- A guestbook entry must have a target user and a message.
- Users cannot modify other users' profiles or pieces.
- Guestbook entries are immutable once posted (except for deletion).

## 2. The Dirty Dozen Payloads

1. **Identity Spoofing (Profile):** Attempt to create/update `/users/victim_uid` with a different `request.auth.uid`.
2. **Shadow Field injection (Profile):** Adding `isAdmin: true` to a profile update.
3. **Identity Spoofing (Piece):** Creating a piece in `/users/victim_uid/pieces/pieceId`.
4. **Unauthorized Deletion (Piece):** Deleting a piece from someone else's page.
5. **Orphaned Write (Piece):** Creating a piece for a non-existent user profile.
6. **Malicious ID Poisoning:** Using a 1MB string as a `pieceId`.
7. **Bypassing Public Privacy:** Reading a private user's pieces.
8. **Guestbook Spam:** Posting 1MB of text in a guestbook message.
9. **Guestbook Proxy Attack:** Posting a guestbook entry with `authorUsername: "System Admin"`.
10. **State Corruption (Piece):** Updating a piece's `type` move-only field to something invalid.
11. **Denial of Wallet:** Rapidly creating 10,000 pieces (checked by size limits).
12. ** PI Leak:** Scanning `/users` to find emails (rules restrict read access to only owner for private fields).

## 3. Test Runner (Draft Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }
    function isValidId(id) { return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\-]+$'); }

    match /users/{userId} {
      allow get: if true;
      allow list: if true;
      allow create: if isOwner(userId) && isValidUser(request.resource.data);
      allow update: if isOwner(userId) && isValidUser(request.resource.data)
                    && request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['username', 'bio', 'subtitle', 'avatarUrl', 'isPublic']);
      
      match /pieces/{pieceId} {
        allow read: if true;
        allow write: if isOwner(userId) && isValidPiece(request.resource.data);
      }

      match /guestbook/{entryId} {
        allow read: if true;
        allow create: if isSignedIn() && isValidGuestbook(request.resource.data);
        allow delete: if isOwner(userId) || (isSignedIn() && resource.data.authorId == request.auth.uid);
      }
    }

    function isValidUser(data) {
      return data.username is string && data.username.size() <= 32
          && data.bio is string && data.bio.size() <= 500
          && data.subtitle is string && data.subtitle.size() <= 50;
    }

    function isValidPiece(data) {
      return data.type in ['music', 'note', 'polaroid', 'decoration', 'guestbook']
          && data.data is map && data.style is map;
    }

    function isValidGuestbook(data) {
      return data.message is string && data.message.size() <= 280
          && data.authorUsername is string && data.authorUsername.size() <= 32;
    }
  }
}
```
