# SFTP Destination

A generic SFTP destination for uploading audience data files via SFTP protocol.

## Features

- Upload audience membership data to any SFTP server
- Configurable SFTP host, port, and credentials per action
- CSV file generation with customizable delimiters
- Batch processing support
- Proper error handling and validation

## Configuration

### Authentication Fields

The destination uses minimal authentication settings (only internal Segment flags). SFTP connection details are configured per action.

### Action: Audience Entered (SFTP)

Uploads audience membership data to a file through SFTP.

#### Fields

- **SFTP Host**: The hostname or IP address of the SFTP server
- **SFTP Port**: The port number for the SFTP connection (optional, default: 22)
- **Username**: Username for SFTP authentication
- **Password**: Password for SFTP authentication
- **Folder Path**: Path within the SFTP server to upload files (must exist)
- **Audience Key**: Unique ID that identifies audience members
- **Identifier Data**: Additional user data to include in the file
- **Delimiter**: Character to separate tokens in the CSV (default: comma)
- **Filename**: Name of the CSV file to upload
- **Batch Settings**: Configure batching behavior

## File Format

The destination generates CSV files with the following structure:

```csv
audience_key,field1,field2,...
"user123","value1","value2",...
```

All values are properly quoted to handle delimiters within data.

## Requirements

- SFTP server must be accessible from Segment's infrastructure
- Target folder path must exist on the SFTP server
- Proper SFTP credentials with write permissions

## Architecture

This destination follows the same pattern as the LiveRamp Audiences destination:

- SFTP credentials are configured at the action level (not destination level)
- Supports batching for efficient file uploads
- Direct SFTP upload without intermediate storage
