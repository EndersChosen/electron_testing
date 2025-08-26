# CanvaScripter - Complete Feature Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Assignments](#assignments)
4. [Assignment Groups](#assignment-groups)
5. [Users](#users)
6. [Conversations](#conversations)
7. [Communication Channels](#communication-channels)
8. [Courses](#courses)
9. [Quizzes](#quizzes)
10. [Modules](#modules)
11. [SIS File Generator](#sis-file-generator)
12. [CSV Support](#csv-support)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**CanvaScripter** is a comprehensive Electron desktop application designed to provide a user-friendly interface for common Canvas LMS (Learning Management System) support operations. Built by Caleb Kruger, this tool streamlines administrative tasks that would otherwise require manual API calls or complex scripting.

### Key Features
- **Intuitive GUI**: Clean, Bootstrap-based interface with organized feature categories
- **Canvas API Integration**: Direct integration with Canvas REST API and GraphQL
- **Batch Operations**: Efficient bulk operations for large-scale administrative tasks
- **Progress Tracking**: Real-time progress bars for long-running operations
- **Error Handling**: Comprehensive error reporting and validation
- **CSV Support**: Import/export functionality with flexible file format support
- **SIS Integration**: Generate sample SIS import files for testing and development

---

## Getting Started

### Initial Setup
1. **Launch the Application**: Start CanvaScripter from your desktop or applications folder
2. **Configure Canvas Connection**:
   - **Domain**: Enter your Canvas domain (e.g., `yourschool.instructure.com`)
   - **API Token**: Enter your Canvas API token with appropriate permissions

### Authentication
- Obtain an API token from your Canvas account settings
- Ensure the token has sufficient permissions for the operations you plan to perform
- The token is stored locally during your session but not permanently saved

### Interface Layout
- **Left Panel**: Feature categories organized in an accordion menu
- **Right Panel**: Dynamic content area showing forms and results
- **Top Bar**: Domain and token configuration

---

## Assignments

The Assignments section provides comprehensive tools for creating, managing, and deleting assignments across courses.

### Create Assignments
**Purpose**: Bulk create multiple assignments for testing or course setup

**Usage**:
1. Navigate to Assignments → Create Assignments
2. Enter the Course ID where assignments should be created
3. Specify the number of assignments to create
4. Click "Create Assignments"

**Features**:
- Creates assignments with realistic names and descriptions
- Automatically sets appropriate due dates
- Assigns to random assignment groups
- Progress tracking for bulk operations

### Delete Assignments (Combined Filters)
**Purpose**: Remove assignments based on multiple criteria simultaneously

**Filters Available**:
- Assignments without submissions
- Assignments without due dates
- Unpublished assignments
- Assignments not in modules
- Assignments created from imports
- Assignments older than a specific date
- Assignments in specific groups

**Usage**:
1. Select "Delete Assignments (combined filters)"
2. Choose your filtering criteria
3. Review the preview of assignments to be deleted
4. Confirm deletion

### Delete Assignments Without Submissions
**Purpose**: Clean up assignments that have no student submissions

**Usage**:
1. Enter the Course ID
2. Select whether to include graded assignments
3. Click "Delete" to remove qualifying assignments

### Delete Assignments Without Due Date
**Purpose**: Remove assignments lacking due date information

**Usage**:
1. Enter the Course ID
2. Click "Delete" to remove assignments without due dates

### Delete Unpublished Assignments
**Purpose**: Remove draft assignments that were never published

**Usage**:
1. Enter the Course ID
2. Click "Delete" to remove unpublished assignments

### Delete Assignments Not in Modules
**Purpose**: Clean up assignments that aren't organized in course modules

**Usage**:
1. Enter the Course ID
2. Click "Delete" to remove unorganized assignments

### Delete Assignments Created From Import
**Purpose**: Remove assignments that were imported from other courses

**Usage**:
1. Enter the Course ID
2. Click "Delete" to remove imported assignments

### Delete Old Assignments
**Purpose**: Archive assignments past their due date by a specified timeframe

**Usage**:
1. Enter the Course ID
2. Specify the cutoff date
3. Click "Delete" to remove old assignments

### Keep Assignments in Specific Group
**Purpose**: Preserve only assignments from a particular assignment group

**Usage**:
1. Enter the Course ID
2. Specify the Assignment Group ID to preserve
3. Click "Keep" to delete all other assignments

### Move Assignments to Single Group
**Purpose**: Consolidate assignments into one assignment group

**Usage**:
1. Enter the Course ID
2. Select source assignments
3. Specify target Assignment Group ID
4. Click "Move" to transfer assignments

### Delete Assignments From Single Group
**Purpose**: Remove all assignments from a specific assignment group

**Usage**:
1. Enter the Course ID
2. Specify the Assignment Group ID
3. Click "Delete" to remove group assignments

---

## Assignment Groups

Assignment Groups help organize assignments into logical categories with specific grading policies.

### Create Assignment Groups
**Purpose**: Set up assignment categories for course organization

**Usage**:
1. Navigate to Assignment Groups → Create Assignment Groups
2. Enter the Course ID
3. Specify the number of groups to create
4. Customize group names and weights (optional)
5. Click "Create Groups"

**Features**:
- Creates groups with descriptive names (Homework, Quizzes, Projects, etc.)
- Sets appropriate weight percentages
- Configures grading policies

### Delete Empty Assignment Groups
**Purpose**: Clean up assignment groups with no assignments

**Usage**:
1. Enter the Course ID
2. Click "Delete Empty Groups"
3. Review groups to be deleted
4. Confirm deletion

**Safety Features**:
- Only removes groups with zero assignments
- Provides preview before deletion
- Prevents accidental removal of active groups

---

## Users

User management tools for page view analytics and notification management.

### Get Users Page Views
**Purpose**: Analyze user activity and engagement in courses

**Usage**:
1. Navigate to Users → Get users Page Views
2. Enter the Course ID or User ID
3. Specify date range (optional)
4. Click "Get Page Views"

**Output**:
- CSV export of page view data
- Includes user information, page URLs, and timestamps
- Useful for engagement analysis and support investigations

**Data Fields**:
- User ID and name
- Page URL and title
- Access timestamp
- Session information
- Device/browser details

### Notifications
**Purpose**: Manage user notification preferences and communication channels

**Usage**:
1. Navigate to Users → Notifications
2. Enter User ID or Course ID
3. Select notification types to update
4. Choose notification preferences
5. Click "Update Notifications"

**Notification Types**:
- Course announcements
- Assignment notifications
- Discussion updates
- Grade changes
- Message notifications

---

## Conversations

Tools for managing Canvas messaging and conversation data.

### Delete Conversations with Specific Subject
**Purpose**: Remove conversations matching specific subject line patterns

**Usage**:
1. Navigate to Conversations → Delete conversations with specific subject
2. Enter the User ID (conversations owner)
3. Specify subject line search criteria
4. Choose exact match or pattern matching
5. Click "Delete Conversations"

**Features**:
- Supports regex pattern matching
- Case-sensitive and case-insensitive options
- Preview matching conversations before deletion
- Bulk deletion with progress tracking

**Use Cases**:
- Remove spam conversations
- Clean up test messages
- Archive old notification messages

### Get Deleted Conversations
**Purpose**: Retrieve information about previously deleted conversations

**Usage**:
1. Navigate to Conversations → Get Deleted Conversations
2. Enter the User ID
3. Specify date range (optional)
4. Click "Get Deleted Conversations"

**Output**:
- List of deleted conversation metadata
- Deletion timestamps
- Original subject lines and participants
- Useful for audit trails and data recovery

---

## Communication Channels

Manage email communication channels, bounced emails, and suppression lists.

### Check Bounce and Suppression List
**Purpose**: Audit email deliverability issues and identify problematic addresses

**Usage**:
1. Navigate to Comm Channels → Check Bounce and Suppression list
2. Choose input method:
   - Enter email addresses manually
   - Upload TXT file with email list
   - Upload CSV file with email data
3. Click "Check Emails"

**Reports Generated**:
- **Bounced Emails**: Addresses that failed delivery
- **Suppressed Emails**: Addresses blocked from receiving emails
- **Valid Emails**: Addresses with no delivery issues
- **Domain Analysis**: Email domain health summary

**Output Formats**:
- CSV export with status details
- Summary statistics
- Detailed error reasons for bounced emails

### Reset Communication Channels
**Purpose**: Reset email addresses to restore delivery after fixing underlying issues

**File Upload Support**:
- **TXT Files**: One email per line or comma-separated
- **CSV Files**: Automatic column detection for email fields

**Supported CSV Columns** (case-insensitive):
- `path`
- `email`
- `email_address`
- `communication_channel_path`

**Usage**:
1. Navigate to Comm Channels → Reset Communication Channels
2. Choose reset method:
   - **Single Email**: Enter one email address
   - **Bulk List**: Enter multiple emails separated by commas or new lines
   - **File Upload**: Select TXT or CSV file
3. Click "Reset Channels"

**Reset Process**:
- Removes bounce flags from email addresses
- Removes addresses from suppression lists
- Re-enables email delivery
- Provides detailed results for each address

### Unconfirmed Emails
**Purpose**: Manage email addresses that haven't been confirmed by users

**Usage**:
1. Navigate to Comm Channels → Unconfirmed emails
2. Choose operation:
   - **List Unconfirmed**: Display all unconfirmed emails
   - **Confirm Emails**: Mark emails as confirmed
   - **Reset Confirmation**: Require re-confirmation
3. Enter criteria (User ID, Course ID, or email pattern)
4. Execute operation

**Batch Operations**:
- Confirm multiple emails simultaneously
- Export unconfirmed email lists
- Send confirmation reminders

---

## Courses

Comprehensive course management including creation, content population, and blueprint course administration.

### Reset Courses
**Purpose**: Reset course content to clean slate for testing or new term setup

**Usage**:
1. Navigate to Courses → Reset Courses
2. Enter Course ID(s)
3. Select reset options:
   - Remove all content
   - Reset grades
   - Clear enrollments
   - Restore to template state
4. Click "Reset Courses"

**Safety Features**:
- Confirmation dialog with course details
- Backup recommendations
- Progress tracking for large courses

### Create Support Courses
**Purpose**: Generate fully-populated courses for testing, training, or support scenarios

**Basic Course Settings**:
- **Course Name**: Custom name or auto-generated
- **Publish Status**: Published or unpublished
- **Blueprint Status**: Enable blueprint functionality

**Blueprint Configuration**:
When blueprint is enabled:
- **Associated Courses**: Number of courses to automatically associate
- **Content Sync**: Automatically sync content to associated courses

**User Management**:
- **Add Users**: Automatically create and enroll users
- **Email Domain**: Custom email domain for generated users
- **Students**: Number of student users to create
- **Teachers**: Number of teacher users to create

**Content Population**:
- **Assignments**: Number of assignments to create
- **Classic Quizzes**: Number of classic quizzes to add
- **New Quizzes**: Number of New Quizzes to create
- **Discussions**: Number of discussion topics
- **Pages**: Number of content pages
- **Modules**: Number of course modules
- **Sections**: Number of course sections

**Advanced Options**:
- **Create Submissions**: Generate sample student submissions
- **Realistic Data**: Use realistic names, dates, and content
- **Progress Tracking**: Monitor creation progress

**Usage Flow**:
1. Navigate to Courses → Create Support Courses
2. Configure basic course settings
3. Enable desired content types and specify quantities
4. Configure user generation if needed
5. Click "Create Course"
6. Monitor progress and review results

### Create Associated Courses
**Purpose**: Create multiple courses and associate them with an existing blueprint course

**Usage**:
1. Navigate to Courses → Create Associated Courses
2. Enter Blueprint Course ID
3. Specify number of courses to create and associate
4. Click "Associate Courses"

**Process**:
- Validates blueprint course status
- Creates new courses with similar settings
- Associates courses with blueprint
- Initiates content sync
- Provides progress updates

**Use Cases**:
- Setting up multiple sections
- Creating training environments
- Establishing course templates

---

## Quizzes

Comprehensive quiz management for both Classic Quizzes and New Quizzes.

### Create Classic Quiz
**Purpose**: Generate traditional Canvas quizzes for testing or course content

**Usage**:
1. Navigate to Quizzes → Create Classic Quiz
2. Enter Course ID
3. Configure quiz settings:
   - Quiz title
   - Description
   - Time limit
   - Attempt limits
   - Due date
4. Add questions (multiple choice, true/false, essay)
5. Click "Create Quiz"

**Question Types Supported**:
- Multiple choice with distractors
- True/False questions
- Short answer
- Essay questions
- Matching questions

**Features**:
- Randomized question order
- Question banks
- Timed quizzes
- Multiple attempts
- Grade passback

### Delete All Classic Quizzes
**Purpose**: Remove all classic quizzes from a course

**Usage**:
1. Navigate to Quizzes → Delete All Classic Quizzes
2. Enter Course ID
3. Confirm deletion (irreversible)
4. Monitor deletion progress

**Safety Features**:
- Lists quizzes before deletion
- Requires confirmation
- Progress tracking

### Create New Quiz
**Purpose**: Generate New Quizzes (next-generation quiz tool)

**Usage**:
1. Navigate to Quizzes → Create New Quiz
2. Enter Course ID
3. Configure quiz settings
4. Click "Create New Quiz"

**New Quiz Features**:
- Enhanced question types
- Better accessibility
- Advanced analytics
- Mobile-optimized
- Rich media support

### Add Questions to New Quiz
**Purpose**: Populate New Quizzes with various question types

**Usage**:
1. Navigate to Quizzes → Add questions to New Quiz
2. Select existing New Quiz
3. Choose question types and quantities
4. Click "Add Questions"

**Question Types**:
- Multiple choice
- Multiple select
- True/False
- Fill in the blank
- Essay
- File upload
- Numerical answer

---

## Modules

Course module management for organizing content structure.

### Create Module
**Purpose**: Set up course modules for content organization

**Usage**:
1. Navigate to Modules → Create Module
2. Enter Course ID
3. Specify module details:
   - Module name
   - Description
   - Prerequisites
   - Unlock dates
4. Click "Create Module"

**Module Features**:
- Sequential unlocking
- Prerequisite requirements
- Completion criteria
- Due dates and availability windows

### Delete Module
**Purpose**: Remove modules and their associated content

**Usage**:
1. Navigate to Modules → Delete Module
2. Enter Course ID
3. Select module to delete
4. Choose whether to delete module items
5. Confirm deletion

**Options**:
- Delete module only (preserve items)
- Delete module and all items
- Move items to another module

---

## SIS File Generator

Generate realistic SIS (Student Information System) import files for Canvas testing and development.

### Create Single SIS File
**Purpose**: Generate individual CSV files for specific SIS import types

**Supported File Types**:
- **Users**: Student and teacher accounts with login credentials
- **Accounts**: Department and organizational structures
- **Terms**: Academic terms (Fall, Spring, Summer, Winter)
- **Courses**: Course listings with realistic course names
- **Sections**: Course sections
- **Enrollments**: Student and teacher enrollments
- **Groups**: Student group definitions
- **Group Categories**: Group category configurations
- **Admins**: Administrative user roles and permissions

**Usage**:
1. Navigate to SIS File Generator → Create Single SIS File
2. Select file type from dropdown
3. Set number of rows to generate (1-10,000)
4. **Configure email domain** (e.g., `@yourschool.edu`)
5. **For Users CSV**: 
   - Click "Fetch Providers" to load authentication providers
   - Select appropriate authentication provider
6. Choose output folder
7. Optionally preview sample data
8. Click "Generate CSV File"

**Generated Data Characteristics**:
- **Realistic Names**: Diverse first and last names
- **Email Addresses**: Generated using your custom domain
- **Course Data**: Realistic subject areas and course numbers
- **Proper Formatting**: Canvas-compatible CSV structure
- **Relationships**: Logical data relationships between files

### Create Bulk SIS Import Package
**Purpose**: Generate complete SIS import packages with multiple file types

**Package Options**:
- Select multiple file types to include
- Set different row counts for each file type
- Apply consistent email domain across all files
- Choose authentication provider for all users
- Automatically create ZIP packages for upload

**Usage**:
1. Navigate to SIS File Generator → Create Bulk SIS Import Package
2. Check desired file types
3. Set row counts for each selected type
4. Configure email domain for user accounts
5. If including Users: Select authentication provider
6. Choose output folder
7. Enable "Create ZIP file for upload" if desired
8. Click "Generate SIS Import Package"

**Package Contents**:
- Individual CSV files for each selected type
- Logical data relationships maintained
- Optional ZIP compression for Canvas upload
- Progress tracking for large datasets

**Authentication Provider Integration**:
- **Automatic Discovery**: Fetches providers from your Canvas instance
- **Provider Types**: SAML, LDAP, CAS, Google, Microsoft, etc.
- **Seamless Integration**: Applied to `authentication_provider_id` field

**Use Cases**:
- Setting up test environments
- Training and demonstration courses
- Development environment population
- Load testing with realistic data

---

## CSV Support

CanvaScripter provides robust CSV file handling capabilities across multiple features.

### File Format Support
- **TXT Files**: Simple text files with email lists
- **CSV Files**: Structured data with automatic column detection

### CSV Column Detection
The application automatically detects email columns with these names (case-insensitive):
- `path`
- `email`
- `email_address`
- `communication_channel_path`

### CSV Parsing Features
- **Quoted Field Support**: Handles commas and quotes within CSV fields
- **Header Detection**: Automatically identifies header rows
- **Empty Row Filtering**: Removes blank rows automatically
- **Error Validation**: Validates email format and provides detailed error messages

### Error Handling
- **Missing Column Errors**: Clear messages when email columns aren't found
- **Format Validation**: Ensures email addresses contain '@' symbols
- **Parsing Errors**: Detailed CSV parsing error information
- **Available Columns**: Lists detected columns when email column is missing

### Example CSV Format
```csv
User ID,Name,Communication channel ID,Type,Path,Date of most recent bounce,Bounce reason
17390,Emerson Rexrode,17357,email,118280@augusta.k12.va.us,,
17528,Mylo Nunez,17440,email,115340@augusta.k12.va.us,,
18923,Ca'Shawn Johnson,17822,email,111569@augusta.k12.va.us,,
```

---

## Troubleshooting

### Common Issues and Solutions

#### Authentication Problems
**Issue**: "Invalid token" or "Unauthorized" errors
**Solutions**:
- Verify API token is correctly entered
- Check token permissions in Canvas
- Ensure token hasn't expired
- Confirm domain is correctly formatted (no https://)

#### Connection Issues
**Issue**: "Network error" or "Cannot connect to Canvas"
**Solutions**:
- Verify Canvas domain is accessible
- Check internet connection
- Confirm Canvas instance is operational
- Try refreshing the application

#### File Upload Problems
**Issue**: "Cannot read file" or "Invalid file format"
**Solutions**:
- Ensure file is properly formatted CSV or TXT
- Check file isn't locked by another application
- Verify file contains expected email columns
- Try saving file with UTF-8 encoding

#### Performance Issues
**Issue**: Slow operations or timeouts
**Solutions**:
- Reduce batch sizes for large operations
- Check Canvas instance performance
- Ensure stable internet connection
- Close other applications to free memory

#### Data Validation Errors
**Issue**: "Invalid course ID" or "User not found"
**Solutions**:
- Verify IDs exist in Canvas
- Check user permissions for accessing data
- Confirm course is in the correct account
- Use GraphQL endpoints for complex queries

### Getting Help
- **Error Messages**: Pay attention to detailed error messages provided
- **Progress Tracking**: Monitor progress bars for long-running operations
- **Logs**: Check browser developer tools for additional error information
- **Canvas Status**: Verify Canvas instance status at status.instructure.com

### Best Practices
- **Backup Data**: Always backup important data before bulk operations
- **Test Small**: Start with small batches before large operations
- **Verify Results**: Review operation results before proceeding
- **Monitor Progress**: Watch progress indicators for long operations
- **Use Staging**: Test operations in staging environment when possible

---

## Advanced Tips

### Efficient Workflows
1. **Batch Operations**: Group similar tasks to minimize API calls
2. **Progress Monitoring**: Use progress bars to track long operations
3. **Error Recovery**: Review failed operations and retry as needed
4. **Data Validation**: Validate input data before starting operations

### API Rate Limits
- Canvas enforces API rate limits
- CanvaScripter includes built-in rate limiting
- Large operations may take longer due to rate limits
- Monitor progress and be patient with bulk operations

### Data Backup
- Always backup important course data
- Export existing data before making changes
- Consider using Canvas export tools for complete backups
- Test operations in staging environments when possible

---

*This documentation covers CanvaScripter v1.0.0. For updates and additional information, refer to the application's built-in help or contact the developer.*
