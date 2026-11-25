const ACCOUNT_KEY = "emsAccounts";
const EMPLOYEE_KEY = "emsEmployees";
const ATTENDANCE_KEY = "emsAttendance";
const LEAVE_KEY = "emsLeaveRequests";
const PAYROLL_KEY = "emsPayroll";
const PERFORMANCE_KEY = "emsReviews";
const JOB_KEY = "emsJobs";
const APPLICATION_KEY = "emsApplications";
const COURSE_KEY = "emsCourses";
const ENROLLMENT_KEY = "emsEnrollments";
const ASSET_KEY = "emsAssets";
const PROFILE_KEY = "emsProfiles";
const NOTIFICATION_KEY = "emsNotifications";
const CURRENT_USER_KEY = "emsCurrentUser";

const demoAccounts = [
    { name: "Admin User", email: "admin@gmail.com", password: "admin123", role: "Admin" },
    { name: "HR Manager", email: "hr@gmail.com", password: "hr123", role: "HR" },
    { name: "Employee User", email: "employee@gmail.com", password: "employee123", role: "Employee" }
];

let currentUser = null;

function readStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : [];
}

function saveStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showSignup() {
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("signupSection").classList.remove("hidden");
    clearMessage("signupError");
    updateSignupRole();
}

function showLogin() {
    document.getElementById("signupSection").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    clearMessage("loginError");
}

function clearMessage(id) {
    document.getElementById(id).textContent = "";
}

function showMessage(id, message) {
    document.getElementById(id).textContent = message;
}

function updateSignupRole() {
    const employee = document.getElementById("signupRole").value === "Employee";
    document.getElementById("employeeSignupDetails").classList.toggle("hidden", !employee);
    ["signupPhone", "signupDepartment", "signupJobTitle", "signupJoiningDate"].forEach(id => {
        document.getElementById(id).required = employee;
    });
    document.getElementById("signupButtonLabel").textContent =
        `Create ${roleLabel(document.getElementById("signupRole").value)} Account →`;
    document.getElementById("signupHelp").textContent = employee
        ? "HR will be notified with your profile details when you create your employee account."
        : "Create an account for the selected workspace.";
}

function addHRNotification(type, title, message, details) {
    const notifications = readStorage(NOTIFICATION_KEY);
    notifications.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        recipientRole: "HR",
        type,
        title,
        message,
        details,
        createdAt: new Date().toISOString(),
        read: false
    });
    saveStorage(NOTIFICATION_KEY, notifications);
}

function login(event) {
    event.preventDefault();
    clearMessage("loginError");

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const role = document.getElementById("loginRole").value;
    const account = [...demoAccounts, ...readStorage(ACCOUNT_KEY)].find(user =>
        user.email.toLowerCase() === email &&
        user.password === password &&
        user.role === role
    );

    if (!account) {
        showMessage("loginError", "Email, password, or account type is incorrect.");
        return;
    }

    currentUser = account;
    saveStorage(CURRENT_USER_KEY, account);
    openApplication();
}

function createAccount(event) {
    event.preventDefault();
    clearMessage("signupError");

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("signupRole").value;
    const accounts = readStorage(ACCOUNT_KEY);
    const emailExists = [...demoAccounts, ...accounts].some(user =>
        user.email.toLowerCase() === email
    );

    if (password !== confirmPassword) {
        showMessage("signupError", "Passwords do not match.");
        return;
    }

    if (emailExists) {
        showMessage("signupError", "An account with this email already exists.");
        return;
    }

    const account = { name, email, password, role };
    if (role === "Employee") {
        account.phone = document.getElementById("signupPhone").value.trim();
        account.department = document.getElementById("signupDepartment").value;
        account.jobRole = document.getElementById("signupJobTitle").value.trim();
        account.joiningDate = document.getElementById("signupJoiningDate").value;
    }
    accounts.push(account);
    saveStorage(ACCOUNT_KEY, accounts);

    if (role === "Employee") {
        const employees = readStorage(EMPLOYEE_KEY);
        employees.push({
            name,
            email,
            phone: account.phone,
            department: account.department,
            jobRole: account.jobRole,
            joiningDate: account.joiningDate
        });
        saveStorage(EMPLOYEE_KEY, employees);
        addHRNotification(
            "employee_registration",
            "New employee registration",
            `${name} created an employee account.`,
            {
                name,
                email,
                phone: account.phone,
                department: account.department,
                jobTitle: account.jobRole,
                joiningDate: account.joiningDate
            }
        );
    }

    document.getElementById("loginEmail").value = email;
    document.getElementById("loginRole").value = role;
    document.getElementById("loginPassword").value = "";
    document.getElementById("signupForm").reset();
    updateSignupRole();
    showLogin();
    showMessage("loginError", `${roleLabel(role)} account created. Sign in with your new credentials.`);
}

function openApplication() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("mainWebsite").classList.remove("hidden");

    currentUser = { ...currentUser, ...(readProfiles()[currentUser.email] || {}) };
    const firstName = currentUser.name.split(/\s+/)[0];
    const initial = currentUser.name.charAt(0).toUpperCase();
    document.getElementById("adminName").textContent = currentUser.name;
    document.getElementById("userRoleLabel").textContent = roleLabel(currentUser.role);
    document.getElementById("workspaceRole").textContent = `${roleLabel(currentUser.role)} Workspace`;
    document.getElementById("welcomeName").textContent = firstName;
    document.getElementById("topAvatar").textContent = initial;
    document.querySelector(".profile-mini .avatar").textContent = initial;

    const employee = currentUser.role === "Employee";
    document.getElementById("welcomeMessage").textContent = employee
        ? "View your attendance and manage your leave requests."
        : "Manage your team, track attendance and simplify HR operations.";
    document.querySelector(".stats-grid").classList.toggle("hidden", employee);
    document.querySelector("#dashboard .content-card").classList.toggle("hidden", employee);

    document.querySelectorAll(".nav").forEach(button => {
        const page = button.dataset.page;
        button.classList.toggle("hidden",
            (employee && page === "employees") ||
            (currentUser.role !== "Admin" && page === "accounts") ||
            (employee && page === "notifications")
        );
    });

    document.getElementById("hrNotificationSummary").classList.toggle("hidden", employee);
    document.getElementById("addEmployeeButton").classList.toggle("hidden", employee);
    document.getElementById("markPresentButton").textContent = employee
        ? "＋ Mark My Attendance"
        : "＋ Mark Present";
    document.getElementById("leaveRequestCard").classList.toggle("hidden", !employee);
    document.getElementById("payrollFormCard").classList.toggle("hidden", currentUser.role !== "HR");
    document.getElementById("reviewFormCard").classList.toggle("hidden", employee);
    document.getElementById("jobFormCard").classList.toggle("hidden", employee);
    document.getElementById("applicationsCard").classList.toggle("hidden", employee);
    document.getElementById("courseFormCard").classList.toggle("hidden", employee);
    document.getElementById("assetFormCard").classList.toggle("hidden", employee);
    document.getElementById("employeeProfileFields").classList.toggle("hidden", !employee);
    document.querySelector("#leaves .section-heading h2").textContent = employee
        ? "My Leave Requests"
        : "Leave Management";
    document.querySelector("#leaves .section-heading p").textContent = employee
        ? "Submit and track your leave requests."
        : "Review and manage employee leave requests.";

    renderAll();
    showPage("dashboard");
}

function roleLabel(role) {
    return role === "HR" ? "HR Manager" : role === "Admin" ? "Administrator" : "Employee";
}

function showPage(pageId) {
    const employeeRestricted = currentUser && currentUser.role === "Employee" && pageId === "employees";
    const adminRestricted = currentUser && currentUser.role !== "Admin" && pageId === "accounts";
    const notificationRestricted = currentUser && currentUser.role === "Employee" && pageId === "notifications";
    if (employeeRestricted || adminRestricted || notificationRestricted) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("hidden", page.id !== pageId);
    });
    document.querySelectorAll(".nav").forEach(button => {
        button.classList.toggle("active", button.dataset.page === pageId);
    });

    const page = document.getElementById(pageId);
    if (!page) return;
    const title = pageId === "dashboard"
        ? "Dashboard"
        : page.querySelector(".section-heading h2")?.textContent || pageId;
    document.getElementById("pageName").textContent = title;
    document.getElementById("breadcrumb").textContent = title.toUpperCase();
}

function getEmployees() {
    const saved = readStorage(EMPLOYEE_KEY);
    const accounts = [...demoAccounts, ...readStorage(ACCOUNT_KEY)];
    const profiles = readProfiles();
    const employees = [...saved];

    accounts.filter(account => account.role === "Employee").forEach(account => {
        const index = employees.findIndex(employee => employee.email.toLowerCase() === account.email.toLowerCase());
        const profile = profiles[account.email] || {};
        if (index >= 0) {
            employees[index] = { ...employees[index], ...profile };
        } else {
            employees.push({
                name: account.name,
                email: account.email,
                phone: account.phone || "",
                department: account.department || "Unassigned",
                jobRole: account.jobRole || roleLabel(account.role),
                joiningDate: account.joiningDate || "",
                ...profile
            });
        }
    });
    return employees;
}

function renderAll() {
    renderEmployees();
    renderAttendance();
    renderLeaves();
    renderDashboard();
    renderNotifications();
    renderPayroll();
    renderReviews();
    renderRecruitment();
    renderTraining();
    renderAssets();
    renderReports();
    renderProfile();
    if (currentUser.role === "Admin") renderAccounts();
}

function renderNotifications() {
    const notifications = readStorage(NOTIFICATION_KEY)
        .filter(notification => notification.recipientRole === "HR")
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    const unread = notifications.filter(notification => !notification.read);
    const navButton = document.querySelector('[data-page="notifications"]');
    navButton.textContent = unread.length
        ? `🔔 Notifications (${unread.length})`
        : "🔔 Notifications";

    const summary = document.getElementById("hrNotificationSummary");
    summary.classList.toggle("hidden", !isManager() || unread.length === 0);
    if (unread.length) {
        const latest = unread[0];
        document.getElementById("hrNotificationMessage").textContent =
            `${unread.length} new notification${unread.length === 1 ? "" : "s"} for HR. Latest: ${latest.title}.`;
        document.getElementById("hrNotificationDetails").textContent =
            Object.entries(latest.details || {})
                .map(([label, value]) => `${label}: ${value}`)
                .join(" · ");
    } else {
        document.getElementById("hrNotificationMessage").textContent = "";
        document.getElementById("hrNotificationDetails").textContent = "";
    }

    document.getElementById("notificationList").innerHTML = notifications.map(notification => {
        const details = Object.entries(notification.details || {})
            .map(([label, value]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}`)
            .join("<br>");
        const action = notification.read
            ? "—"
            : `<button class="approve-btn" onclick="markNotificationRead('${escapeAttribute(notification.id)}')">Mark read</button>`;
        return `<tr>
            <td><strong>${escapeHtml(notification.title)}</strong><br>${escapeHtml(notification.message)}</td>
            <td>${details}</td>
            <td>${escapeHtml(new Date(notification.createdAt).toLocaleString())}</td>
            <td><span class="status ${notification.read ? "approved" : "pending"}">${notification.read ? "Read" : "New"}</span></td>
            <td>${action}</td>
        </tr>`;
    }).join("") || '<tr><td colspan="5">No HR notifications yet.</td></tr>';
}

function markNotificationRead(notificationId) {
    if (!isManager()) return;
    const notifications = readStorage(NOTIFICATION_KEY);
    const notification = notifications.find(item =>
        item.id === notificationId && item.recipientRole === "HR"
    );
    if (!notification) return;
    notification.read = true;
    saveStorage(NOTIFICATION_KEY, notifications);
    renderNotifications();
}

function renderDashboard() {
    const employees = getEmployees();
    const attendance = readStorage(ATTENDANCE_KEY);
    const leaves = readStorage(LEAVE_KEY);
    document.getElementById("totalEmployees").textContent = employees.length;
    document.getElementById("presentCount").textContent =
        attendance.filter(record => record.date === todayKey()).length;
    document.getElementById("pendingCount").textContent =
        leaves.filter(request => request.status === "Pending").length;
    document.getElementById("departmentCount").textContent =
        new Set(employees.map(employee => employee.department).filter(Boolean)).size;

    document.getElementById("recentEmployees").innerHTML = employees.slice(-5).reverse().map(employee => `
        <tr>
            <td>${escapeHtml(employee.name)}</td>
            <td>${escapeHtml(employee.email)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>${escapeHtml(employee.jobRole)}</td>
        </tr>
    `).join("") || '<tr><td colspan="4">No employees added yet.</td></tr>';
}

function renderAccounts() {
    const accounts = [...demoAccounts, ...readStorage(ACCOUNT_KEY)];
    document.getElementById("accountList").innerHTML = accounts.map(account => `
        <tr>
            <td>${escapeHtml(account.name)}</td>
            <td>${escapeHtml(account.email)}</td>
            <td>${escapeHtml(roleLabel(account.role))}</td>
        </tr>
    `).join("");
}

function provisionHRAccount(event) {
    event.preventDefault();
    clearMessage("accountError");
    if (currentUser.role !== "Admin") return;

    const name = document.getElementById("hrName").value.trim();
    const email = document.getElementById("hrEmail").value.trim().toLowerCase();
    const password = document.getElementById("hrPassword").value;
    const accounts = readStorage(ACCOUNT_KEY);
    if ([...demoAccounts, ...accounts].some(account => account.email.toLowerCase() === email)) {
        showMessage("accountError", "An account with this email already exists.");
        return;
    }

    accounts.push({ name, email, password, role: "HR" });
    saveStorage(ACCOUNT_KEY, accounts);
    document.getElementById("provisionHRForm").reset();
    renderAccounts();
}

function renderEmployees() {
    const employees = getEmployees();
    const search = document.getElementById("searchInput").value.trim().toLowerCase();
    const filtered = employees.filter(employee =>
        `${employee.name} ${employee.email} ${employee.department} ${employee.jobRole}`
            .toLowerCase().includes(search)
    );

    document.getElementById("employeeList").innerHTML = filtered.map(employee => `
        <tr>
            <td>${escapeHtml(employee.name)}</td>
            <td>${escapeHtml(employee.email)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td>${escapeHtml(employee.jobRole)}</td>
            <td>${currentUser.role === "Admin"
                ? `<button class="delete-btn" onclick="deleteEmployee('${escapeAttribute(employee.email)}')">Remove</button>`
                : "—"}</td>
        </tr>
    `).join("") || '<tr><td colspan="5">No employees found.</td></tr>';
}

function openForm() {
    document.getElementById("employeeForm").classList.remove("hidden");
}

function closeForm() {
    document.getElementById("employeeForm").classList.add("hidden");
}

function addEmployee(event) {
    event.preventDefault();
    const name = document.getElementById("empName").value.trim();
    const email = document.getElementById("empEmail").value.trim().toLowerCase();
    const department = document.getElementById("empDept").value;
    const jobRole = document.getElementById("empRole").value.trim();

    if (getEmployees().some(employee => employee.email.toLowerCase() === email)) {
        alert("An employee with this email already exists.");
        return;
    }

    const employees = readStorage(EMPLOYEE_KEY);
    employees.push({ name, email, department, jobRole });
    saveStorage(EMPLOYEE_KEY, employees);
    document.getElementById("addEmployeeForm").reset();
    closeForm();
    renderAll();
}

function deleteEmployee(email) {
    if (currentUser.role !== "Admin" || !confirm("Remove this employee from the directory?")) return;
    saveStorage(EMPLOYEE_KEY, readStorage(EMPLOYEE_KEY).filter(employee => employee.email !== email));
    saveStorage(ACCOUNT_KEY, readStorage(ACCOUNT_KEY).filter(account =>
        account.email !== email || account.role !== "Employee"
    ));
    renderAll();
}

function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function renderAttendance() {
    const employees = getEmployees();
    const records = readStorage(ATTENDANCE_KEY).filter(record => record.date === todayKey());
    const visibleEmployees = currentUser.role === "Employee"
        ? employees.filter(employee => employee.email.toLowerCase() === currentUser.email.toLowerCase())
        : employees;
    document.getElementById("todayDate").textContent = new Date().toLocaleDateString();
    document.getElementById("attendanceList").innerHTML = visibleEmployees.map(employee => {
        const isPresent = records.some(record => record.email.toLowerCase() === employee.email.toLowerCase());
        return `<tr>
            <td>${escapeHtml(employee.name)}</td>
            <td>${escapeHtml(employee.department)}</td>
            <td><span class="status ${isPresent ? "present" : "pending"}">${isPresent ? "Present" : "Not Marked"}</span></td>
        </tr>`;
    }).join("") || '<tr><td colspan="3">No attendance records to show.</td></tr>';
}

function markPresent() {
    let employee;
    if (currentUser.role === "Employee") {
        employee = getEmployees().find(item => item.email.toLowerCase() === currentUser.email.toLowerCase());
        if (!employee) {
            employee = { name: currentUser.name, email: currentUser.email, department: "Unassigned" };
        }
    } else {
        const email = prompt("Enter the employee email to mark present:");
        if (!email) return;
        employee = getEmployees().find(item => item.email.toLowerCase() === email.trim().toLowerCase());
        if (!employee) {
            alert("No employee was found with that email.");
            return;
        }
    }

    const attendance = readStorage(ATTENDANCE_KEY);
    if (attendance.some(record =>
        record.email.toLowerCase() === employee.email.toLowerCase() && record.date === todayKey()
    )) {
        alert("Attendance has already been marked for today.");
        return;
    }
    attendance.push({ email: employee.email, name: employee.name, department: employee.department, date: todayKey() });
    saveStorage(ATTENDANCE_KEY, attendance);
    renderAll();
}

function renderLeaves() {
    const leaves = readStorage(LEAVE_KEY);
    const visibleLeaves = currentUser.role === "Employee"
        ? leaves.filter(request => request.email.toLowerCase() === currentUser.email.toLowerCase())
        : leaves;
    document.getElementById("leaveList").innerHTML = visibleLeaves.map((request, index) => {
        const buttons = currentUser.role === "Employee" || request.status !== "Pending"
            ? "—"
            : `<button class="approve-btn" onclick="updateLeave(${index}, 'Approved')">Approve</button>
               <button class="reject-btn" onclick="updateLeave(${index}, 'Rejected')">Reject</button>`;
        return `<tr>
            <td>${escapeHtml(request.name)}</td>
            <td>${escapeHtml(request.type)}</td>
            <td>${request.days}</td>
            <td><span class="status ${request.status.toLowerCase()}">${escapeHtml(request.status)}</span></td>
            <td>${buttons}</td>
        </tr>`;
    }).join("") || '<tr><td colspan="5">No leave requests yet.</td></tr>';
}

function submitLeaveRequest(event) {
    event.preventDefault();
    clearMessage("leaveError");
    const type = document.getElementById("leaveType").value;
    const start = document.getElementById("leaveStart").value;
    const end = document.getElementById("leaveEnd").value;
    if (end < start) {
        showMessage("leaveError", "End date must be on or after the start date.");
        return;
    }

    const days = Math.round((new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`)) / 86400000) + 1;
    const leaves = readStorage(LEAVE_KEY);
    leaves.push({ name: currentUser.name, email: currentUser.email, type, start, end, days, status: "Pending" });
    saveStorage(LEAVE_KEY, leaves);
    addHRNotification(
        "leave_request",
        "New leave request",
        `${currentUser.name} submitted a ${type.toLowerCase()} request.`,
        { name: currentUser.name, email: currentUser.email, leaveType: type, startDate: start, endDate: end, days }
    );
    document.getElementById("leaveRequestForm").reset();
    renderLeaves();
    renderDashboard();
    renderNotifications();
}

function updateLeave(index, status) {
    if (currentUser.role === "Employee") return;
    const leaves = readStorage(LEAVE_KEY);
    const visibleIndices = leaves.reduce((indices, request, requestIndex) => {
        if (currentUser.role !== "Employee" || request.email.toLowerCase() === currentUser.email.toLowerCase()) {
            indices.push(requestIndex);
        }
        return indices;
    }, []);
    const actualIndex = visibleIndices[index];
    if (actualIndex === undefined || !leaves[actualIndex]) return;
    leaves[actualIndex].status = status;
    saveStorage(LEAVE_KEY, leaves);
    renderLeaves();
    renderDashboard();
}

function isManager() {
    return currentUser.role === "Admin" || currentUser.role === "HR";
}

function readProfiles() {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? JSON.parse(stored) : {};
}

function employeeByEmail(email) {
    return getEmployees().find(employee =>
        employee.email.toLowerCase() === email.trim().toLowerCase()
    );
}

function renderPayroll() {
    const records = readStorage(PAYROLL_KEY);
    const visible = isManager()
        ? records
        : records.filter(record => record.email.toLowerCase() === currentUser.email.toLowerCase());
    document.getElementById("payrollList").innerHTML = visible.map(record => `
        <tr>
            <td>${escapeHtml(record.name)}</td>
            <td>${escapeHtml(record.period)}</td>
            <td>${new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(record.amount)}</td>
        </tr>
    `).join("") || '<tr><td colspan="3">No payroll records available.</td></tr>';
}

function savePayroll(event) {
    event.preventDefault();
    clearMessage("payrollError");
    if (currentUser.role !== "HR") return;

    const email = document.getElementById("payrollEmail").value.trim().toLowerCase();
    const employee = employeeByEmail(email);
    if (!employee) {
        showMessage("payrollError", "Add this person to the employee directory first.");
        return;
    }

    const period = document.getElementById("payrollPeriod").value;
    const amount = Number(document.getElementById("payrollAmount").value);
    const records = readStorage(PAYROLL_KEY);
    const existing = records.find(record =>
        record.email.toLowerCase() === email && record.period === period
    );
    if (existing) {
        existing.amount = amount;
        existing.name = employee.name;
    } else {
        records.push({ email, name: employee.name, period, amount });
    }
    saveStorage(PAYROLL_KEY, records);
    document.getElementById("payrollForm").reset();
    renderPayroll();
    renderReports();
}

function renderReviews() {
    const reviews = readStorage(PERFORMANCE_KEY);
    const visible = isManager()
        ? reviews
        : reviews.filter(review => review.email.toLowerCase() === currentUser.email.toLowerCase());
    document.getElementById("reviewList").innerHTML = visible.map(review => `
        <tr>
            <td>${escapeHtml(review.name)}</td>
            <td>${escapeHtml(review.cycle)}</td>
            <td>${review.rating}/5</td>
            <td>${escapeHtml(review.feedback)}</td>
        </tr>
    `).join("") || '<tr><td colspan="4">No reviews available.</td></tr>';
}

function saveReview(event) {
    event.preventDefault();
    clearMessage("reviewError");
    if (!isManager()) return;

    const email = document.getElementById("reviewEmail").value.trim().toLowerCase();
    const employee = employeeByEmail(email);
    if (!employee) {
        showMessage("reviewError", "Add this person to the employee directory first.");
        return;
    }
    const reviews = readStorage(PERFORMANCE_KEY);
    reviews.push({
        email,
        name: employee.name,
        cycle: document.getElementById("reviewCycle").value.trim(),
        rating: Number(document.getElementById("reviewRating").value),
        feedback: document.getElementById("reviewFeedback").value.trim()
    });
    saveStorage(PERFORMANCE_KEY, reviews);
    document.getElementById("reviewForm").reset();
    renderReviews();
    renderReports();
}

function renderRecruitment() {
    const jobs = readStorage(JOB_KEY);
    const applications = readStorage(APPLICATION_KEY);
    document.getElementById("jobList").innerHTML = jobs.map(job => {
        const applied = applications.some(application =>
            application.jobId === job.id &&
            application.email.toLowerCase() === currentUser.email.toLowerCase()
        );
        const action = isManager()
            ? `<button class="secondary-btn" onclick="toggleJob('${escapeAttribute(job.id)}')">${job.status === "Open" ? "Close" : "Reopen"}</button>`
            : job.status !== "Open"
                ? "Closed"
                : applied
                    ? "Applied"
                    : `<button class="primary-btn" onclick="applyForJob('${escapeAttribute(job.id)}')">Apply</button>`;
        return `<tr>
            <td>${escapeHtml(job.title)}</td>
            <td>${escapeHtml(job.department)}</td>
            <td>${escapeHtml(job.location)}</td>
            <td>${applications.filter(application => application.jobId === job.id).length}</td>
            <td>${action}</td>
        </tr>`;
    }).join("") || '<tr><td colspan="5">No open roles have been posted.</td></tr>';

    document.getElementById("applicationList").innerHTML = applications.map(application => `
        <tr>
            <td>${escapeHtml(application.name)}</td>
            <td>${escapeHtml(application.email)}</td>
            <td>${escapeHtml(application.title)}</td>
            <td>${escapeHtml(application.appliedAt)}</td>
        </tr>
    `).join("") || '<tr><td colspan="4">No applications received.</td></tr>';
}

function postJob(event) {
    event.preventDefault();
    clearMessage("jobError");
    if (!isManager()) return;

    const jobs = readStorage(JOB_KEY);
    jobs.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: document.getElementById("jobTitle").value.trim(),
        department: document.getElementById("jobDepartment").value.trim(),
        location: document.getElementById("jobLocation").value.trim(),
        status: "Open"
    });
    saveStorage(JOB_KEY, jobs);
    document.getElementById("jobForm").reset();
    renderRecruitment();
}

function applyForJob(jobId) {
    if (currentUser.role !== "Employee") return;
    const jobs = readStorage(JOB_KEY);
    const job = jobs.find(item => item.id === jobId && item.status === "Open");
    if (!job) return;
    const applications = readStorage(APPLICATION_KEY);
    if (applications.some(application =>
        application.jobId === jobId &&
        application.email.toLowerCase() === currentUser.email.toLowerCase()
    )) return;
    applications.push({
        jobId,
        title: job.title,
        name: currentUser.name,
        email: currentUser.email,
        appliedAt: new Date().toLocaleDateString()
    });
    saveStorage(APPLICATION_KEY, applications);
    renderRecruitment();
    renderReports();
}

function toggleJob(jobId) {
    if (!isManager()) return;
    const jobs = readStorage(JOB_KEY);
    const job = jobs.find(item => item.id === jobId);
    if (!job) return;
    job.status = job.status === "Open" ? "Closed" : "Open";
    saveStorage(JOB_KEY, jobs);
    renderRecruitment();
}

function renderTraining() {
    const courses = readStorage(COURSE_KEY);
    const enrollments = readStorage(ENROLLMENT_KEY);
    document.getElementById("courseList").innerHTML = courses.map(course => {
        const enrolled = enrollments.some(enrollment =>
            enrollment.courseId === course.id &&
            enrollment.email.toLowerCase() === currentUser.email.toLowerCase()
        );
        const count = enrollments.filter(enrollment => enrollment.courseId === course.id).length;
        const action = isManager()
            ? "Published"
            : enrolled
                ? "Enrolled"
                : `<button class="primary-btn" onclick="enrollInCourse('${escapeAttribute(course.id)}')">Enroll</button>`;
        return `<tr>
            <td>${escapeHtml(course.title)}</td>
            <td>${escapeHtml(course.date)}</td>
            <td>${escapeHtml(course.description)}</td>
            <td>${count}</td>
            <td>${action}</td>
        </tr>`;
    }).join("") || '<tr><td colspan="5">No courses have been published.</td></tr>';
}

function publishCourse(event) {
    event.preventDefault();
    clearMessage("courseError");
    if (!isManager()) return;

    const courses = readStorage(COURSE_KEY);
    courses.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: document.getElementById("courseTitle").value.trim(),
        date: document.getElementById("courseDate").value,
        description: document.getElementById("courseDescription").value.trim()
    });
    saveStorage(COURSE_KEY, courses);
    document.getElementById("courseForm").reset();
    renderTraining();
}

function enrollInCourse(courseId) {
    if (currentUser.role !== "Employee") return;
    const course = readStorage(COURSE_KEY).find(item => item.id === courseId);
    if (!course) return;
    const enrollments = readStorage(ENROLLMENT_KEY);
    if (enrollments.some(enrollment =>
        enrollment.courseId === courseId &&
        enrollment.email.toLowerCase() === currentUser.email.toLowerCase()
    )) return;
    enrollments.push({ courseId, email: currentUser.email, name: currentUser.name });
    saveStorage(ENROLLMENT_KEY, enrollments);
    renderTraining();
    renderReports();
}

function renderAssets() {
    const assets = readStorage(ASSET_KEY);
    const visible = isManager()
        ? assets
        : assets.filter(asset => asset.email.toLowerCase() === currentUser.email.toLowerCase());
    document.getElementById("assetList").innerHTML = visible.map(asset => `
        <tr>
            <td>${escapeHtml(asset.name)}</td>
            <td>${escapeHtml(asset.tag)}</td>
            <td>${escapeHtml(asset.employeeName)}</td>
            <td><span class="status present">Assigned</span></td>
        </tr>
    `).join("") || '<tr><td colspan="4">No assigned assets.</td></tr>';
}

function assignAsset(event) {
    event.preventDefault();
    clearMessage("assetError");
    if (!isManager()) return;

    const email = document.getElementById("assetEmail").value.trim().toLowerCase();
    const employee = employeeByEmail(email);
    if (!employee) {
        showMessage("assetError", "Add this person to the employee directory first.");
        return;
    }
    const tag = document.getElementById("assetTag").value.trim();
    const assets = readStorage(ASSET_KEY);
    if (assets.some(asset => asset.tag.toLowerCase() === tag.toLowerCase())) {
        showMessage("assetError", "That asset tag is already in use.");
        return;
    }
    assets.push({
        name: document.getElementById("assetName").value.trim(),
        tag,
        email,
        employeeName: employee.name
    });
    saveStorage(ASSET_KEY, assets);
    document.getElementById("assetForm").reset();
    renderAssets();
}

function renderReports() {
    const container = document.getElementById("reportsContent");
    const employeeView = currentUser.role === "Employee";
    const attendance = readStorage(ATTENDANCE_KEY).filter(record =>
        !employeeView || record.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const leaves = readStorage(LEAVE_KEY).filter(request =>
        !employeeView || request.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const payroll = readStorage(PAYROLL_KEY).filter(record =>
        !employeeView || record.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const reviews = readStorage(PERFORMANCE_KEY).filter(review =>
        !employeeView || review.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const enrollments = readStorage(ENROLLMENT_KEY).filter(enrollment =>
        !employeeView || enrollment.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const metrics = employeeView
        ? [
            ["Attendance Records", attendance.length],
            ["Leave Requests", leaves.length],
            ["Payroll Records", payroll.length],
            ["Performance Reviews", reviews.length],
            ["Courses Enrolled", enrollments.length]
        ]
        : [
            ["Employees", getEmployees().length],
            ["Present Today", attendance.filter(record => record.date === todayKey()).length],
            ["Pending Leave", leaves.filter(request => request.status === "Pending").length],
            ["Open Roles", readStorage(JOB_KEY).filter(job => job.status === "Open").length],
            ["Applications", readStorage(APPLICATION_KEY).length],
            ["Training Enrollments", readStorage(ENROLLMENT_KEY).length]
        ];
    container.innerHTML = metrics.map(([label, value]) => `
        <div class="stat-card">
            <p>${escapeHtml(label)}</p>
            <h2>${escapeHtml(value)}</h2>
            <span>${employeeView ? "Your account summary" : "Current workspace"}</span>
        </div>
    `).join("");
}

function renderProfile() {
    const profile = readProfiles()[currentUser.email] || {};
    const employee = employeeByEmail(currentUser.email) || {};
    document.getElementById("profileName").value = currentUser.name;
    document.getElementById("profileEmail").value = currentUser.email;
    document.getElementById("profilePhone").value = profile.phone || currentUser.phone || "";
    document.getElementById("profileDepartment").value = employee.department || "";
    document.getElementById("profileJobTitle").value = employee.jobRole || "";
}

function saveProfile(event) {
    event.preventDefault();
    const name = document.getElementById("profileName").value.trim();
    const profiles = readProfiles();
    const profile = {
        ...(profiles[currentUser.email] || {}),
        name,
        phone: document.getElementById("profilePhone").value.trim()
    };

    if (currentUser.role === "Employee") {
        profile.department = document.getElementById("profileDepartment").value.trim();
        profile.jobRole = document.getElementById("profileJobTitle").value.trim();
    }
    profiles[currentUser.email] = profile;
    saveStorage(PROFILE_KEY, profiles);
    currentUser = { ...currentUser, ...profile };
    saveStorage(CURRENT_USER_KEY, currentUser);

    const accounts = readStorage(ACCOUNT_KEY);
    const account = accounts.find(item => item.email.toLowerCase() === currentUser.email.toLowerCase());
    if (account) {
        account.name = name;
        saveStorage(ACCOUNT_KEY, accounts);
    }
    const employees = readStorage(EMPLOYEE_KEY);
    const employee = employees.find(item => item.email.toLowerCase() === currentUser.email.toLowerCase());
    if (employee && currentUser.role === "Employee") {
        employee.name = name;
        employee.phone = profile.phone;
        employee.department = profile.department;
        employee.jobRole = profile.jobRole;
        saveStorage(EMPLOYEE_KEY, employees);
    }

    document.getElementById("adminName").textContent = name;
    document.getElementById("welcomeName").textContent = name.split(/\s+/)[0];
    document.querySelector(".profile-mini .avatar").textContent = name.charAt(0).toUpperCase();
    document.getElementById("topAvatar").textContent = name.charAt(0).toUpperCase();
    showMessage("profileMessage", "Profile updated successfully.");
    renderAll();
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    currentUser = null;
    document.getElementById("mainWebsite").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("loginForm").reset();
    showLogin();
}

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("signupForm").addEventListener("submit", createAccount);
document.getElementById("signupRole").addEventListener("change", updateSignupRole);
document.getElementById("addEmployeeForm").addEventListener("submit", addEmployee);
document.getElementById("leaveRequestForm").addEventListener("submit", submitLeaveRequest);
document.getElementById("provisionHRForm").addEventListener("submit", provisionHRAccount);
document.getElementById("payrollForm").addEventListener("submit", savePayroll);
document.getElementById("reviewForm").addEventListener("submit", saveReview);
document.getElementById("jobForm").addEventListener("submit", postJob);
document.getElementById("courseForm").addEventListener("submit", publishCourse);
document.getElementById("assetForm").addEventListener("submit", assignAsset);
document.getElementById("profileForm").addEventListener("submit", saveProfile);
document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.page));
});

const storedUser = localStorage.getItem(CURRENT_USER_KEY);
if (storedUser) {
    currentUser = JSON.parse(storedUser);
    openApplication();
}

window.addEventListener("storage", event => {
    if (event.key === NOTIFICATION_KEY && currentUser && isManager()) {
        renderNotifications();
    }
});
