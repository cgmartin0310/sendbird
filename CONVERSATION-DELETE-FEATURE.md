# Conversation Deletion Feature

## Overview
Users can now delete conversations they created. Admins can delete any conversation.

## Features

### 1. Delete Button
- Red trash icon appears next to each conversation
- Only visible for:
  - Conversations you created
  - All conversations if you're an admin
- Hover effect for better UX

### 2. Confirmation Dialog
- Browser confirmation popup: "Are you sure you want to delete this conversation?"
- Prevents accidental deletions
- Clear warning that action cannot be undone

### 3. Authorization
- **Regular Users**: Can only delete conversations they created
- **Admins**: Can delete any conversation
- **Care Team Members**: Can only delete their own conversations

### 4. What Gets Deleted

When you delete a conversation:
1. **Sendbird Channel**: Removed from Sendbird platform
2. **Database Records**: 
   - Conversation record
   - All conversation member associations
   - Compliance tracking data
3. **Messages**: All messages in the channel are permanently deleted

### 5. Error Handling

- If deletion fails, an error message appears
- Loading state shows "Deleting..." during operation
- Delete button is disabled while processing

## How to Use

1. Go to the Conversations page
2. Find the conversation you want to delete
3. Click the red trash icon (only visible if you can delete it)
4. Confirm the deletion in the popup
5. Conversation disappears from the list

## Backend API

```http
DELETE /api/conversations/:id
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

**Error Response** (403 Forbidden):
```json
{
  "error": "Only the conversation creator or an admin can delete this conversation"
}
```

## Security

- Server-side authorization check
- Can't delete conversations you don't have permission for
- Audit trail maintained (who deleted what)

## Important Notes

⚠️ **Deletion is permanent** - There's no undo feature
⚠️ **All messages are lost** - Make sure to export important information first
⚠️ **Affects all members** - The conversation disappears for everyone

## Future Enhancements

- Soft delete option (archive instead of delete)
- Bulk deletion for admins
- Export conversation before deletion
- Deletion audit log viewing