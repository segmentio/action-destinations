# SFTP Destination

A generic SFTP destination for syncing Segment events and audiences to an SFTP server

## Overview

The SFTP destination provides a reliable way to export Segment event data to external systems via SFTP file uploads. It supports batched data with configurable file formatting, including

- filename
- extension
- delimiter

## Key Features

- **Event Data Sync**: Supports identify, track, and other Segment event types
- **Audience Support**: Handles audience membership data from Segment Engage
- **Flexible CSV Format**: Configurable delimiters (comma, tab, pipe, etc.)
- **Batch Processing**: Handles large data volumes
- **Robust Error Handling**: Comprehensive validation and timeout protection

## Architecture

### Core Components

The destination logic is split between the following:

- **`client.ts`**: SFTP connection management and file upload operations
- **`functions.ts`**: Data processing, file generation, and business logic
- **`fields.ts`**: Field definitions and data mapping configuration
- **`index.ts`**: Destination definition and authentication setup

### Data Flow

1. **Validation**: Checks SFTP credentials and required fields
2. **Column Processing**: Maps Segment data to CSV columns based on field configuration
3. **File Generation**: Creates properly formatted CSV with headers and quoted values
4. **Filename Creation**: Generates timestamped filenames with configurable prefixes
5. **SFTP Upload**: Securely uploads files with timeout protection and error handling

## Configuration

### Authentication Settings

SFTP connection details are configured at the destination level:

- **SFTP Host**: Hostname or IP address of the SFTP server
- **SFTP Port**: Port number (default: 22)
- **Username**: SFTP authentication username
- **Password**: SFTP authentication password

### Action: Sync to SFTP

The single action handles all event types and supports extensive field mapping.

#### Core Settings

- **Folder Path**: Target directory on SFTP server (must exist)
- **Filename Prefix**: Prefix for generated files (timestamp automatically appended)
- **File Extension**: Output format (`csv` or `txt`)
- **Delimiter**: Field separator (comma, tab, pipe, or custom character)
- **Batch Size**: Maximum events per file (default: 100,000)

#### Data Mapping

The destination supports flexible column mapping for:

- **Standard Fields**: event_name, event_type, user_id, anonymous_id, email
- **Event Data**: properties, traits, context, timestamp, message_id
- **Audience Fields**: audience_name, audience_id, audience_space_id
- **Custom Fields**: Any additional data through the columns object

#### Audience-Specific Features

- **Audience Action Column**: Boolean indicating audience membership
- **Batch Size Column**: Number of events in the current batch
- **Computation Key**: Audience identifier for membership tracking

## File Format

### Standard CSV Structure

```csv
event_name,user_id,email,timestamp,properties
"Page Viewed","user123","user@example.com","2025-01-15T10:30:00Z","{""page"":""home""}"
"Product Clicked","user456","user2@example.com","2025-01-15T10:31:00Z","{""product_id"":""abc123""}"
```

### Audience Membership Format

```csv
user_id,email,audience_name,audience_action,batch_size
"user123","user@example.com","High Value Customers",true,50
"user456","user2@example.com","High Value Customers",false,50
```

### Data Handling

- **Proper Quoting**: All values are CSV-escaped to handle delimiters within data
- **Null Values**: Empty strings for undefined/null values
- **Complex Objects**: JSON stringification for nested data structures
- **Delimiter Safety**: Column names are cleaned to remove delimiter characters

## Error Handling & Reliability

### Validation

- **Authentication**: Verifies SFTP credentials before processing
- **Path Validation**: Checks folder existence and write permissions
- **Data Validation**: Ensures required fields are present

### Error Types

- **`InvalidAuthenticationError`**: Missing or invalid SFTP credentials
- **`PayloadValidationError`**: Invalid folder paths or data issues
- **`SelfTimeoutError`**: SFTP operations exceeding timeout limits
- **SFTP-specific errors**: Network, permission, and file system issues

### Timeout Protection

- Configurable timeout for SFTP operations (default: 30 seconds)
- Graceful connection cleanup on timeout
- Detailed error logging for debugging

## Requirements

### SFTP Server

- SSH/SFTP protocol support
- Write permissions to target folder path
- Network accessibility from Segment's infrastructure
- Sufficient storage space for uploaded files

### Data Considerations

- Folder paths must exist (destination won't create directories)
- Filenames are automatically timestamped to prevent overwrites

## Development & Testing

### Code Quality

- **Comprehensive Tests**: 100% line coverage with unit, integration, and fixture tests
- **TypeScript**: Full type safety with generated types
- **Error Scenarios**: Extensive testing of edge cases and error conditions

### Test Coverage

- **Client Operations**: SFTP connection, upload, and error handling
- **Data Processing**: File generation, field processing, and edge cases
- **Integration**: End-to-end workflows with real data patterns
- **Fixtures**: Validation using 14+ test data files with various delimiters
