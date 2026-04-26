# Privacy Delete Endpoint

## `DELETE /api/user/:id/data`

Permanently deletes all data associated with a user ID, including:
- All sessions
- All turns (transcripts, scores, feedback)
- User account record

### Example

```bash
curl -X DELETE https://your-backend.up.railway.app/api/user/USER_ID/data
```

### Response

```json
{
  "deleted": true,
  "userId": "abc-123",
  "deletedAt": "2024-11-01T10:00:00.000Z"
}
```

### Notes
- This action is irreversible.
- Audio is never stored long-term; only transcript text and scores are deleted.
- Compliant with India's DPDP Act right-to-erasure requirements.
