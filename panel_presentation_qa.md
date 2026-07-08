# Presentation Panel Q&A Guide

Prepare for your project presentation with these anticipated questions from the review panel, along with detailed, technical explanations and answers.

---

## Theme 1: Session Tracking and Anonymous Bookings

### Q1: How does the system implement "anonymous booking" without requiring students to log in or register?
**Answer:**
We implement anonymous tracking using a hybrid approach combining **Client-Side Device Tokens** and **Server-Side IP Address Capturing**:
- **Device Token (Client-Side)**: When a student first visits the homepage, the application generates a unique UUID (Universally Unique Identifier) and stores it in the browser's `localStorage` as `device_token`. This token persists indefinitely across refreshes and browser sessions.
- **IP Address (Server-Side)**: On every claim request, the backend extracts the client's current IP address (checking headers like `x-forwarded-for` to account for reverse proxies, and falling back to the socket's remote address).
- **Claim Retrieval**: When fetching "My Claimed Rooms", the backend runs an `OR` condition:
  `WHERE rc.ip_address = ? OR rc.device_token = ?`
  This ensures that even if a student changes devices (but stays on the same campus Wi-Fi) or clears their browser local storage, their active claims are still associated with them.

### Q2: What happens if a student refreshes their page? Does the system remember their active claims?
**Answer:**
Yes, it remembers them.
1. The client-side page reads the persistent `device_token` from `localStorage`.
2. It sends a request to the backend `GET /api/claims/my-claims?device_token=UUID_HERE`.
3. The server checks the database for any active claim matching that device token OR the request's current IP address where the claim end-time is in the future (`end_time > NOW()`).
4. The claims are returned and displayed in the **My Claimed Rooms** page, allowing the user to view their PINs and release them with one click.

---

## Theme 2: Concurrency, Scaling, and Rate Limits

### Q3: What happens if multiple students try to claim the exact same classroom at the exact same millisecond?
**Answer:**
The system is protected against race conditions and double-bookings:
1. Before inserting a claim, the server executes Check 1.5/3.5:
   `SELECT COUNT(*) FROM room_claims WHERE classroom_id = ? AND start_time < ? AND end_time > ?`
   in a database query.
2. If another student's insert query completes a fraction of a millisecond earlier, the second student's check will return a count > 0, blocking the request and returning a `409 Conflict` status code.
3. For enterprise production, we would wrap this check-and-insert in a MySQL transaction with an **ISOLATION LEVEL** of `SERIALIZABLE` or use `SELECT ... FOR UPDATE` row-locking to fully serialize claims processing.

### Q4: How is the system protected against spam or denial-of-service (DoS) from booking requests?
**Answer:**
- We implemented **API Rate Limiting** using the `express-rate-limit` middleware on the room claim route (`/api/claims`).
- It is capped at **20 booking requests per hour per IP address**.
- This allows students ample requests to search, test, and book, while preventing automated scripts from spamming the server and locking all rooms in the campus.

---

## Theme 3: Business Rules and Date/Time Mathematics

### Q5: Why is room claiming restricted to classrooms with a capacity of less than 25?
**Answer:**
Large classrooms (capacity > 25) are resource-heavy spaces like major lecture halls, computer labs, or specialized design studios. Booking them for small study groups would lead to massive under-utilization of campus space. We enforce this limit in the database schema and validate it on the server:
- If a student tries to book a room with capacity > 25, the server returns a `403 Forbidden` error explaining that large spaces are walk-in/shared-use only.

### Q6: Why are bookings restricted to 8:15 AM to 5:15 PM? Can a student book tomorrow's slot tonight?
**Answer:**
- **Validation**: Classes and campus events run between 8:15 AM and 5:15 PM. Booking a room outside these hours is blocked on the server, returning a `400 Bad Request` if `start_time` or `end_time` fall outside the `08:15` to `17:15` range.
- **Booking for tomorrow**: Yes, a student can book tomorrow's morning slot. If they visit the site at night (e.g. 8:00 PM), the client automatically defaults to **tomorrow's weekday** at **08:15 AM**.
- **Week Rollover Logic**: If a student books a slot for Monday 10:15 AM when it is already Monday 8:00 PM, the backend's `getDatetimeForDayAndTime` detects that this slot has already passed in the current calendar week. It automatically adds **7 days** to roll the booking date over to next week's Monday morning, preventing claims from expiring immediately.

---

## Theme 4: Database Seeding & Setup

### Q7: How did you seed/prepopulate the database with rooms and schedules?
**Answer:**
We built a custom seeding utility (`seed.js`):
1. **Truncating safely**: The script temporarily disables foreign key checks in MySQL (`SET FOREIGN_KEY_CHECKS = 0`), truncates all existing tables (clearing previous runs), and re-enables them.
2. **Academic & Campus Import**: Imports schools, courses, student groups, buildings, and classrooms from `seedData.json`.
3. **Programmatic Lecturer Generation**: Programmatically seeds 30 lecturers with English first names, Kenyan last names, and formatted Strathmore institutional emails (e.g. `John Wekesa` -> `jwekesa@strathmore.edu`).
4. **Domain-Specific Unit Generation**: Automatically generates and inserts 64 unique units per course (8 per semester, 16 per year) with names and codes customized to the course's domain (e.g. Computing courses get IT topics, Law gets legal units, etc.).
5. **Admin Setup**: Creates a default Super Administrator user if it does not already exist.

---

## Theme 5: Future Enhancements

### Q8: If you had more time, what features would you implement next?
**Answer:**
1. **Calendar Integrations**: Automatically email students an `.ics` invite or sync claims to Google/Outlook Calendars.
2. **NFC / Smart Lock Integration**: Connect the 4-digit cancellation PIN to smart lock keypads outside classrooms. The room door would only unlock if the PIN is entered during the claimed slot.
3. **IoT Occupancy Sensors**: Install cheap motion sensors (PIR) in classrooms. If a student claims a room but does not show up within 15 minutes, the sensor detects no movement, and the server automatically releases the claim.
4. **Admin Analytics Dashboard**: Provide graphs tracking peak booking hours, buildings with highest demand, and common booking durations to help university administration optimize class scheduling.

---

## Theme 6: Priority Overrides & Date Rollover Logic

### Q9: What happens if a student claims a classroom, and then the administrator schedules an official class at that same place and time? Who has priority?
**Answer:**
Official university classes **always take priority**. We have implemented an automated conflict resolution rule inside the backend:
- When an administrator inserts or updates a timetable entry in the `timetables` table (handled in [timetableController.js](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/controllers/timetableController.js#L193) and [timetableController.js](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/controllers/timetableController.js#L264)), the server executes an auto-revoke query:
  ```sql
  DELETE FROM room_claims 
  WHERE classroom_id = ? 
    AND DAYNAME(start_time) = ? 
    AND TIME(start_time) < ? 
    AND TIME(end_time) > ?
  ```
- This automatically deletes any student bookings for that classroom that overlap with the newly scheduled official class. When the student refreshes their dashboard or checks "My Claimed Rooms", their conflicting claim will have been cleanly removed, and the room will show up as timetabled.

### Q10: How does the server know the calendar date for booking a room? Where is the code that does this, and how does it work?
**Answer:**
The server computes dates dynamically using the `getDatetimeForDayAndTime(dayOfWeek, timeStr, baseDateStr)` helper function located in both [claimsController.js](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/controllers/claimsController.js#L4) and [searchController.js](file:///home/tumaini/Documents/ExternalProjects/CS-Project/fully-developed-classroom-finder/server/src/controllers/searchController.js#L4).

Here is how the code logic works step-by-step:
1. **Calculate the day difference (`diff`)**: It compares the index of the requested weekday (e.g., Monday = 1) with the current system day index (e.g., Wednesday = 3) using `now.getDay()`.
2. **Apply difference to today's date**: It sets the calendar day using `targetDate.setDate(now.getDate() + diff)`. This aligns the target day with the current calendar week.
3. **Apply time**: It parses the `timeStr` (e.g. `'08:15'`) and applies the hours and minutes to `targetDate`.
4. **Enforce Week Rollover**: If the calculated `targetDate` has already passed today (i.e. `targetDate < now`), it adds **7 days** (`targetDate.setDate(targetDate.getDate() + 7)`) to automatically schedule it for next week instead of letting it expire instantly.
5. **Ensure Start and End Date alignment**: When calculating the end time, it passes the formatted start time as a third parameter (`baseDateStr`). If `baseDateStr` is present, it directly copies its calendar year, month, and day, bypassing the rollover logic. This prevents start and end times from splitting across different days.
