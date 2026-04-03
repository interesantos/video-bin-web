# Shotstack API — File Upload & Storage Policies

## File Upload Limits

### Individual File Size
- **5 GB** max per source file
- **10 GB** fetch limit when downloading files from external URLs

### Per-Render Limits (depends on disk type)
| Disk Type | Source Files | Output File |
|-----------|-------------|-------------|
| **Local** (default) | 512 MB combined | 512 MB |
| **Mount** | 5 GB | 512 MB |

## Storage Limits

- No specific GB limit publicly documented per tier
- Essentials and higher tiers include CDN-enabled hosting and storage
- Pay As You Go plans are subject to **fair use** — excessive bandwidth or storage may be throttled

## File Retention

### Temporary Files (without Shotstack Destination)
- All generated files **expire after 24 hours**
- Must be downloaded or transferred before deletion

### Permanent Storage (with Shotstack Destination — default)
- Rendered assets are sent to Shotstack's permanent CDN hosting
- Ingest API uploads remain available until manually deleted
- Files stay online as long as account has credits
- Shotstack may delete accounts and storage after **3 months of inactivity** or negative credit balance

## Summary

| Aspect | Limit |
|--------|-------|
| Max file size | 5 GB per file |
| Number of files | No documented limit |
| Total storage | No documented GB limit (fair use) |
| Retention (with hosting) | Permanent while account is active |
| Retention (without hosting) | 24 hours |
