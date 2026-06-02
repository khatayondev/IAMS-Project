# Student Applications Page - Testing Guide

## ✅ Pre-Test Verification

### Code Fixes Applied
- **TermSelector**: ✅ Displays open terms with "Open" badge
- **CompanyBranchSelector**: ✅ Loads real branches via `apiClient.getCompanyBranches()`
- **ApplicationTracker**: ✅ Shows correct student info from API (snake_case fields)
- **Dashboard**: ✅ Supervisor name displays correctly
- **Documents**: ✅ Upload buttons show "Coming Soon"
- **History**: ✅ "View Details" button navigates to applications

---

## 🧪 Manual Testing Steps

### **Test 1: Open Applications Page**

1. Open browser → `http://localhost:5173/student/applications`
2. You should see: **"Term Windows" tab (default view)**
3. **Expected**: List of academic terms with open/closed status

**Verify:**
- ✅ Terms load from API
- ✅ Open terms show "Open" green badge
- ✅ Closed terms are grayed out and disabled
- ✅ Can only click on open terms

---

### **Test 2: Start New Application**

1. Click on an **open term** (with green "Open" badge)
2. Click **"Apply for this Term"** button
3. **Expected**: Redirected to Step 1 - **Company Selection**

**Verify:**
- ✅ Term selector shows the term you selected is highlighted
- ✅ Eligibility check passes (no error message)
- ✅ Can proceed to next step

---

### **Test 3: Select Existing Company**

1. On **Step 1 - Company Selection**, type company name in search box
2. Select a company from the dropdown
3. **Expected**: Company is selected and highlighted

**Verify:**
- ✅ Company search works (filters by name)
- ✅ Selected company is highlighted in blue
- ✅ Shows company info: name, city, region

---

### **Test 4: Branch Loading (THE KEY FIX)**

1. After selecting a company, check the **Branch** dropdown
2. **BEFORE FIX**: Would show "No branches recorded yet" (hardcoded empty)
3. **AFTER FIX**: Should show real branches from API or empty if company has no branches

**Verify:**
- ✅ Branches load when you select a company (useEffect triggers)
- ✅ If company has branches, they display in the list
- ✅ If company has no branches, shows "No branches" message
- ✅ Can select an existing branch OR add new branch

---

### **Test 5: Add New Branch**

1. Select a company that has branches (or any company)
2. Click **"Add a new branch"** option (or "+ Add new branch" button)
3. Fill in branch details:
   - **Branch Name** *(required)*
   - **Region** (dropdown with Ghana regions)
   - **Location**
   - **Address**
   - **Telephone**
4. Click **"Create Branch"** or **"Next"**

**Verify:**
- ✅ Form validates: Branch name is required
- ✅ Duplicate branch name is caught (checks against loaded branches)
- ✅ Branch creation calls real API: `POST /api/v1/companies/:id/branches`
- ✅ New branch is added to the list

---

### **Test 6: Fill Personal Details**

1. **Step 3 - Personal Details** form should show:
   - ✅ Phone Number
   - ✅ Emergency Contact Name
   - ✅ Emergency Contact Phone
   - ✅ Preferred Start Date

**Verify:**
- ✅ All fields are present and required
- ✅ Phone validation works (if applicable)
- ✅ Can navigate forward

---

### **Test 7: Application Review & Submit**

1. **Step 4 - Review** should show:
   - **Student Profile** (auto-filled from user context):
     - Student Name
     - Student ID
     - Department
   - **Selected Term**
   - **Selected Company & Branch**
   - **Personal Details** (phone, emergency contact, etc.)

**Verify:**
- ✅ Student name comes from `user?.name` (not hardcoded)
- ✅ Student ID comes from `user?.studentId`
- ✅ Department comes from `user?.department`
- ✅ All form data is displayed for review
- ✅ **Submit Application** button is present

---

### **Test 8: Submit Application**

1. Click **"Submit Application"**
2. **Expected**: API call to `POST /api/v1/applications/{id}/submit`
3. **Expected**: Success message and redirect to application tracker

**Verify:**
- ✅ Application submits successfully
- ✅ Status changes from "draft" to "submitted"
- ✅ Application appears in tracker tab

---

### **Test 9: Check Application Tracker**

1. Go back to **Applications Page**
2. Click **"Application Tracker"** tab
3. Should show your submitted application

**Verify:**
- ✅ Application info displays correctly (student name, ID, company, etc.)
- ✅ Status is "submitted"
- ✅ All field data comes from API (not empty/null)
- ✅ Timeline shows: Submitted → (Pending Review)

---

### **Test 10: Check History Page**

1. Go to **Student > History** menu
2. Your recent internship should show in the history list
3. Click **"View Details"** button

**Verify:**
- ✅ "View Details" button navigates to `/student/applications`
- ✅ Application tracker shows the same application
- ✅ All data matches

---

### **Test 11: Check Dashboard**

1. Go to **Student > Dashboard**
2. **Internship Status** card should show:
   - Status: "submitted" (or current status)
   - Company name from API
   - Supervisor name (if assigned)

**Verify:**
- ✅ Company name displays: `company?.name` (API field)
- ✅ Supervisor name displays: `academic_supervisor?.user?.name` (snake_case fix)
- ✅ No blank/undefined values

---

### **Test 12: Check Documents Page**

1. Go to **Student > Documents**
2. All upload/download buttons should show **"Coming Soon"**
3. **Industry Supervisor Magic Link** form should be functional

**Verify:**
- ✅ No fake upload modals (all removed)
- ✅ Buttons are disabled with "Coming Soon" tooltip
- ✅ Magic link form works (real API endpoint)
- ✅ No hardcoded fake filenames

---

## 🎯 Key Things to Verify

| Feature | Before Fix | After Fix |
|---------|-----------|-----------|
| **Terms Display** | ❌ | ✅ Active terms show "Open" badge |
| **Branch Loading** | ❌ Empty array | ✅ Loads from `GET /api/v1/companies/:id/branches` |
| **Student Info** | ❌ Hardcoded | ✅ From API snake_case (`student?.user?.name`) |
| **Supervisor Name** | ❌ Null/undefined | ✅ From `academic_supervisor?.user?.name` |
| **Document Uploads** | ❌ Fake modals | ✅ "Coming Soon" state |
| **History Navigation** | ❌ No onclick | ✅ Navigates to `/student/applications` |

---

## 📝 Expected API Calls

When using the Student Applications page, you should see these API calls (in browser DevTools → Network):

```
GET  /api/v1/applications          (load student's applications)
GET  /api/v1/terms                 (load academic terms)
GET  /api/v1/companies             (load companies)
GET  /api/v1/companies/:id/branches (load branches when company is selected) ✅ KEY FIX
POST /api/v1/applications          (create draft application)
PUT  /api/v1/applications/:id      (update draft application)
POST /api/v1/applications/:id/submit (submit application)
```

---

## 🔍 Debugging Tips

If something doesn't work:

1. **Open DevTools** (F12)
2. Check **Network tab** for failed API calls
3. Check **Console tab** for JavaScript errors
4. Check **Application Context**: `user?.department`, `user?.studentId`, `user?.name` should be populated

---

## ✨ Success Criteria

✅ All tests pass = **Student applications page is fully functional**

You should be able to:
1. View active terms
2. Apply for an open term
3. Select/create company
4. Load real branches for the company
5. Fill in personal details
6. Review complete application (with student profile auto-filled)
7. Submit application
8. See application in tracker with correct data
9. View application in history
10. Dashboard shows correct supervisor name
11. Documents page shows "Coming Soon" (no fake uploads)
