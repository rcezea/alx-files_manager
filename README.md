# File Management API

## Overview

This project is a comprehensive backend system designed to manage user authentication and file operations in a secure and efficient manner. Built using Node.js, MongoDB, and Redis, it provides a robust platform for file management, including uploading, viewing, and managing files with various permissions.

## Objectives

The platform aims to deliver a streamlined experience for users to interact with files, focusing on the following key functionalities:

### User Authentication

Users can securely authenticate via token-based access, ensuring that only authorized individuals can interact with their files.
File Management
Users can upload files, organize them into folders, and manage file permissions. This includes making files public or private and generating thumbnails for image files.

### File Access

The system supports listing all files, viewing file details, and downloading file content based on user permissions.

## Key Features

### Token-Based Authentication:

Secure user access and manage sessions using tokens issued upon successful login.

### File Upload & Organization:

Upload new files or create folders to organize content efficiently.

### Permission Management:

Change file visibility to public or private, controlling who can access or view the content.
File Viewing: Retrieve and download file content, with specific support for image thumbnails.

### Pagination & Background Processing:

Handle large volumes of data and perform operations asynchronously for improved performance.

### Technology Stack

Node.js: For server-side logic and handling API requests.
MongoDB: To store user data and file metadata, providing a scalable database solution.
Redis: Used for caching and session management, enhancing the system’s performance and responsiveness.

## Installation

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd project-root
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory with the following content:
    ```plaintext
    PORT=5000
    DB_HOST=localhost
    DB_PORT=27017
    DB_DATABASE=files_manager
    FOLDER_PATH=/tmp/files_manager
    ```

4. Start the server:
    ```bash
    npm run start-server
    ```

## [Endpoints](https://github.com/rcezea/alx-files_manager/blob/main/API%20Documentation.md)



## Environment Variables

Create a `.env` file in the root directory with the following environment variables:

PORT=5000
DB_HOST=localhost
DB_PORT=27017
DB_DATABASE=files_manager
FOLDER_PATH=/tmp/files_manager


## Testing

To run tests, use:
```bash
npm test
```

## Linting

Lint your code using ESLint:
```bash
npm run lint
```

## Contributing

Contributions are welcome! Fork the repository and submit a pull request.