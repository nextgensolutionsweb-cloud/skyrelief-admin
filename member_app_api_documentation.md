# SkyRelief Member Mobile App - API Documentation

This documentation provides the complete API reference required for developing the SkyRelief Member Mobile App. It covers all backend endpoints specifically tailored for Member interactions.

> [!IMPORTANT]
> **Base URL**: The exact Base URL will depend on your environment (e.g., `https://api.skyrelief.com`). All API endpoints listed here are relative to this Base URL.

---

## 1. Common Headers
All authenticated APIs (after login) require the following headers for authorization. These are returned in the Login API response.

| Header Key | Example Value | Description |
| :--- | :--- | :--- |
| `apikey` | `sk_rel_981723...` | The API Key identifying the device/session |
| `token` | `eyJhbGciOiJIU...` | The JWT authentication token |

---

## 2. Authentication Module

### 2.1 Login API
Authenticate a member using their unique Member Code and Password.

*   **Endpoint**: `POST /api/auth/login`
*   **Method**: `POST`
*   **Headers**: None (Unauthenticated)
*   **Request Body**:
```json
{
  "platform": "member",
  "member_code": "SKY12345",
  "password": "yourpassword"
}
```

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Login successful",
  "r": {
    "platform": "member",
    "user": {
      "id": 15,
      "role_id": 3,
      "full_name": "Ramesh Bhai",
      "email": "ramesh@example.com",
      "phone": "9876543210",
      "profile": "uploads/profile/image.jpg",
      "member_id": 10,
      "member_code": "SKY12345"
    },
    "auth": {
      "id": 12,
      "user_id": 15,
      "apikey": "sk_rel_...",
      "token": "eyJhbG...",
      "status": 1
    }
  }
}
```

> [!TIP]
> **Storage Strategy**: Store the `apikey` and `token` from `r.auth` securely on the device (e.g., Flutter Secure Storage). Include them in the headers of all subsequent API requests.

### 2.2 Forgot Password API
Initiate the forgot password flow by requesting an OTP.

*   **Endpoint**: `POST /api/auth/forgot-password`
*   **Method**: `POST`
*   **Request Body**:
```json
{
  "platform": "member",
  "member_code": "SKY12345"
}
```

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Forgot password OTP sent successfully on WhatsApp",
  "r": {
    "platform": "member",
    "user_id": 15,
    "phone": "9876543210"
  }
}
```

### 2.3 Verify OTP (Account Activation)
If a user needs to verify their phone number, an OTP is sent during signup/creation.

*   **Endpoint**: `POST /api/user/verify-otp`
*   **Method**: `POST`
*   **Request Body**:
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

### 2.4 Reset Password
Reset the password using the OTP received via WhatsApp.

*   **Endpoint**: `POST /api/auth/reset-password`
*   **Method**: `POST`
*   **Request Body**:
```json
{
  "platform": "member",
  "member_code": "SKY12345",
  "otp": "123456",
  "new_password": "newsecurepassword123"
}
```

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Password reset successfully",
  "r": null
}
```

### 2.5 Logout
Currently, logout is handled entirely on the client side.
*   **Flow**: Clear the stored `apikey`, `token`, and user data from the device storage and redirect the user back to the Login screen.

---

## 3. User Profile Module

### 3.1 Get Profile Details
Fetch the complete profile information for the logged-in member.

*   **Endpoint**: `GET /api/user/get-details`
*   **Method**: `GET`
*   **Headers**: `apikey`, `token`

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Member details fetched successfully",
  "r": {
    "user_details": {
      "id": 15,
      "full_name": "Ramesh Bhai",
      "email": "ramesh@example.com",
      "phone": "9876543210",
      "profile": "uploads/profile.jpg"
    },
    "member_details": {
      "id": 10,
      "member_code": "SKY12345",
      "first_name": "Ramesh",
      "last_name": "Bhai",
      "gender": "Male",
      "dob": "1990-01-01"
    },
    "address": { ... },
    "documents": [ ... ],
    "assigned_plans": [ ... ]
  }
}
```

### 3.2 Update Profile
Update member's editable information (e.g., profile image, full name).

*   **Endpoint**: `POST /api/user/update-profile`
*   **Method**: `POST` (Form-Data)
*   **Headers**: `apikey`, `token`
*   **Request Body** (FormData):
    *   `full_name` (optional): "Ramesh Kumar"
    *   `profile` (optional): [File Object for Image]

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Profile updated successfully",
  "r": { ...updated user object... }
}
```

### 3.3 Change Password
Allow an authenticated user to change their password securely.

*   **Endpoint**: `POST /api/user/change-password`
*   **Method**: `POST`
*   **Headers**: `apikey`, `token`
*   **Request Body**:
```json
{
  "current_password": "oldpassword123",
  "new_password": "newsecurepassword456"
}
```

---

## 4. Dashboard Module

### 4.1 Member Dashboard Data
Fetch the aggregated metrics to be displayed on the app's home screen.

*   **Endpoint**: `GET /api/user-dashboard/member`
*   **Method**: `GET`
*   **Headers**: `apikey`, `token`

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Member Dashboard Data Fetched",
  "r": {
    "total_plans": 2,
    "active_plans": 1,
    "upcoming_marriages": 0,
    "payment_due_count": 3
  }
}
```
*   **Total Plans**: Count of all insurance plans the member has ever joined.
*   **Active Plans**: Count of plans currently marked as active (`status = 1`).
*   **Upcoming Marriages**: Count of marriages flagged as upcoming (`status = 1`).
*   **Payment Due Count**: Count of active/pending payment dues (`status = 0`).

---

## 5. My Plans Module

### 5.1 List My Joined Plans
Fetch detailed list of all insurance plans the member is enrolled in.

*   **Endpoint**: `GET /api/user-dashboard/my-plans`
*   **Method**: `GET`
*   **Headers**: `apikey`, `token`

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Plans Fetched Successfully",
  "r": [
    {
      "plan_id": 5,
      "plan_name": "Premium Marriage Vima",
      "joining_amount": "500.00",
      "joining_date": "2026-05-12T00:00:00.000Z",
      "insurance_status": 1,
      "agent_name": "Suresh Agent"
    }
  ]
}
```

---

## 6. Payment Module

### 6.1 My Payment Dues
Fetch all payment dues associated with the logged-in member.

*   **Endpoint**: `GET /api/payment/my-dues`
*   **Method**: `GET`
*   **Headers**: `apikey`, `token`

*   **Success Response** (200 OK):
```json
{
  "s": 1,
  "m": "Pending payments fetched successfully",
  "r": [
    {
      "due_id": 45,
      "campaign_no": "CMP-834921",
      "plan_name": "Premium Marriage Vima",
      "campaign_period": "2026-07-01 to 2026-07-15",
      "start_date": "2026-07-01T00:00:00.000Z",
      "end_date": "2026-07-15T00:00:00.000Z",
      "due_date": "2026-07-20T00:00:00.000Z",
      "total_payable_amount": "100.00",
      "married_count": 2,
      "status": 0
    }
  ]
}
```

> [!NOTE]
> Phase 1 does **not** include online payment functionality. The frontend should display these items as "Pending" (if `status = 0`) or "Paid" (if `status = 1`) without a "Pay Now" button.

---

## 7. Marriage Module
Currently, Marriage information is retrieved either through the general dashboard APIs (for counts) or through specific admin endpoints. Detailed isolated marriage tracking on the member app is reserved for future implementation or relies on aggregated dashboard counts (`upcoming_marriages`).

---

## 8. Notifications Module
Reserved for future implementation. The backend tables exist (`user_notifications`), but endpoints for the mobile app are not yet fully spec'd.

---

## 9. Status Mapping
Ensure UI elements (colors, icons) accurately reflect these standard database statuses.

#### Member Account Status
*   `1` = Active
*   `0` = Blocked/Pending
*   `-1` = Deleted

#### Insurance/Plan Status
*   `1` = Active
*   `2` = Married (Settled)
*   `3` = Invoice Generated
*   `-1` = Removed

#### Marriage Status
*   `1` = Upcoming
*   `2` = Married / Completed

#### Payment Due Status
*   `0` = Pending
*   `1` = Paid
*   `-1` = Cancelled

---

## 10. Error Handling
All APIs follow a standard JSON response structure. Success is always determined by `"s": 1`. Errors return `"s": 0` along with a message `"m"`.

*   **200 OK**: Request successful, but check `"s"` value (can be 0 for logical errors).
*   **400 Bad Request**: Missing parameters or validation failure.
*   **401 Unauthorized**: Token/API key is missing or invalid. Log the user out immediately.
*   **403 Forbidden**: Account suspended or blocked.
*   **404 Not Found**: Data not found.
*   **409 Conflict**: Duplicate data (e.g., duplicate email/phone during signup).
*   **500 Internal Server Error**: Backend crash.

**Sample Error Response:**
```json
{
  "s": 0,
  "m": "Invalid token or session expired",
  "r": null
}
```

---

## 11. Mobile App Flow (Recommended)
1.  **Splash Screen**: Check secure storage for `apikey` & `token`.
2.  **Login**: If no token, present Login Screen (Member Code + Password).
3.  **Store Tokens**: Upon successful login, save `apikey`, `token`, and `member_id`.
4.  **Get Details**: Fetch `/api/user/get-details` to cache profile name & image.
5.  **Dashboard Screen**: Call `/api/user-dashboard/member` and display metrics.
6.  **My Plans Screen**: Call `/api/user-dashboard/my-plans` to list active policies.
7.  **Payments Screen**: Call `/api/payment/my-dues` to list all historical and pending collections.
8.  **Profile Screen**: Allow profile edit `/api/user/update-profile` and `/api/user/change-password`.
9.  **Logout**: Clear local secure storage and redirect to Login.

---

## 12. API Reference Table

| Module | Endpoint | Method | Auth Req. | Description |
| :--- | :--- | :--- | :---: | :--- |
| **Auth** | `/api/auth/login` | `POST` | ❌ | Login using Member Code & Password |
| **Auth** | `/api/auth/forgot-password` | `POST` | ❌ | Request OTP on WhatsApp for reset |
| **Auth** | `/api/auth/reset-password` | `POST` | ❌ | Reset password using OTP |
| **User** | `/api/user/get-details` | `GET` | ✅ | Fetch complete profile and assigned plans |
| **User** | `/api/user/update-profile` | `POST` | ✅ | Update profile info & avatar (FormData) |
| **User** | `/api/user/change-password` | `POST` | ✅ | Update password inside the app |
| **Dashboard** | `/api/user-dashboard/member` | `GET` | ✅ | Fetch dashboard KPI counts |
| **Dashboard** | `/api/user-dashboard/my-plans` | `GET` | ✅ | List all insurance plans member is in |
| **Payment** | `/api/payment/my-dues` | `GET` | ✅ | List pending and paid collection dues |
