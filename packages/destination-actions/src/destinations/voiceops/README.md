# Voiceops

## Regal event mappings

Create two mappings using the same Voiceops destination credentials and base URL:

Base URL is optional and defaults to `https://projectfrontline.net`. Existing destinations can omit it; set it only when using a different Voiceops host.

| Segment event              | Voiceops action                             | Purpose                                                             |
| -------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `call.recording.available` | Send Call Completed (`sendCallCompleted`)   | Ingest the recording.                                               |
| `call.completed`           | Update Call Metadata (`updateCallMetadata`) | Retain completion metadata and reconcile it with the recorded call. |

The existing Send Call Completed action keeps its name, field requirements, and defaults. For Regal recording events, explicitly set its subscription to `type = "track" and event = "call.recording.available"` and map `properties.started_at` to `call_started_at` and `properties.recording_link` to `recording_url`. Map `call_id` and `agent_email` from the corresponding properties as usual.

Update Call Metadata defaults to `type = "track" and event = "call.completed"`. Configure:

- **Call ID:** `properties.call_id`, matching the recording's external identifier.
- **Call Completed At:** `properties.completed_at`, a Unix timestamp in seconds. The default also accepts `properties.call_completed_at`, with that field taking precedence. Use the original completion time on retries.
- **Extra Metadata:** explicitly map the metadata fields to retain, such as `disposition`, using the same destination metadata keys as the existing integration. The default reads `properties.extraMetadata`; raw Regal events need this object configured in the mapping editor.

Example metadata request:

```json
{
  "call_id": "call-123",
  "call_completed_at": "1789394517",
  "extraMetadata": {
    "disposition": "Appointment Set"
  }
}
```

The action posts to `/frontline-api/integrations/v1/segment/metadata`. It requires a call ID, completion timestamp, and nonempty metadata object. It does not require a recording URL, agent email, or call start time.

Send a complete metadata snapshot with each update. The backend retains the latest completion snapshot per call, ignores older snapshots, and rejects differing snapshots with the same completion timestamp. It can reconcile metadata received before or after the recording. An accepted response confirms retention; reconciliation completes asynchronously.

Do not map the entire Regal properties object into Extra Metadata. The backend reserves `call_id`, `call_started_at`, `recording_url`, `agent_email`, `channels`, `agentLegs`, `voiceops_segment_source_call_id`, and `source` for recording identity and transfer attribution. The action rejects those keys instead of silently dropping them.
