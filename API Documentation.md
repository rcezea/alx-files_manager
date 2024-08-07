# API DOCUMENTATION
### User Endpoints

#### Create User

- **Request:**
  ```bash
  curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }'
  ```

- **Response:**
  ```json
  {"id":"5f1e7d35c7ba06511e683b21","email":"bob@dylan.com"}
  ```

- **Errors:**
    - **User Already Exists:**
      ```bash
      curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com", "password": "toto1234!" }'
      ```
      ```json
      {"error":"Already exist"}
      ```
    - **Missing Password:**
      ```bash
      curl 0.0.0.0:5000/users -XPOST -H "Content-Type: application/json" -d '{ "email": "bob@dylan.com" }'
      ```
      ```json
      {"error":"Missing password"}
      ```

#### Connect

- **Request:**
  ```bash
  curl 0.0.0.0:5000/connect -H "Authorization: Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE="
  ```

- **Response:**
  ```json
  {"token":"031bffac-3edc-4e51-aaae-1c121317da8a"}
  ```

#### Get User Info

- **Request:**
  ```bash
  curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a"
  ```

- **Response:**
  ```json
  {"id":"5f1e7cda04a394508232559d","email":"bob@dylan.com"}
  ```

- **Errors:**
    - **Unauthorized:**
      ```bash
      curl 0.0.0.0:5000/users/me -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a"
      ```
      ```json
      {"error":"Unauthorized"}
      ```

#### Disconnect

- **Request:**
  ```bash
  curl 0.0.0.0:5000/disconnect -H "X-Token: 031bffac-3edc-4e51-aaae-1c121317da8a"
  ```

### File Endpoints

#### Upload File

- **Request:**
  ```bash
  curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "myText.txt", "type": "file", "data": "SGVsbG8gV2Vic3RhY2shCg==" }'
  ```

- **Response:**
  ```json
  {"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0}
  ```

#### Create Folder

- **Request:**
  ```bash
  curl -XPOST 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f" -H "Content-Type: application/json" -d '{ "name": "images", "type": "folder" }'
  ```

- **Response:**
  ```json
  {"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0}
  ```

#### Get Files

- **Request:**
  ```bash
  curl -XGET 0.0.0.0:5000/files -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
  ```

- **Response:**
  ```json
  [{"id":"5f1e879ec7ba06511e683b22","userId":"5f1e7cda04a394508232559d","name":"myText.txt","type":"file","isPublic":false,"parentId":0},{"id":"5f1e881cc7ba06511e683b23","userId":"5f1e7cda04a394508232559d","name":"images","type":"folder","isPublic":false,"parentId":0},{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
  ```

- **Get Files by Parent ID:**
  ```bash
  curl -XGET 0.0.0.0:5000/files?parentId=5f1e881cc7ba06511e683b23 -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
  ```

- **Response:**
  ```json
  [{"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}]
  ```

#### Get File Data

- **Request:**
  ```bash
  curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
  ```

- **Response:**
  ```text
  Hello Webstack!
  ```

- **Errors:**
    - **Not Found (when file is unpublished):**
      ```bash
      curl -XGET 0.0.0.0:5000/files/5f1e879ec7ba06511e683b22/data
      ```
      ```json
      {"error":"Not found"}
      ```

#### Publish/Unpublish File

- **Publish File:**
  ```bash
  curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/publish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
  ```

- **Response:**
  ```json
  {"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":true,"parentId":"5f1e881cc7ba06511e683b23"}
  ```

- **Unpublish File:**
  ```bash
  curl -XPUT 0.0.0.0:5000/files/5f1e8896c7ba06511e683b25/unpublish -H "X-Token: f21fb953-16f9-46ed-8d9c-84c6450ec80f"
  ```

- **Response:**
  ```json
  {"id":"5f1e8896c7ba06511e683b25","userId":"5f1e7cda04a394508232559d","name":"image.png","type":"image","isPublic":false,"parentId":"5f1e881cc7ba06511e683b23"}
  ```

### Notes
- Ensure the `Authorization` header contains the correct base64-encoded credentials.
- Use the token from /connect as `X-Token`

Updates to come!
