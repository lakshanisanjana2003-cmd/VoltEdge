# Entity Relationship Diagram (VoltEdge)

The system has seven entities: PROFESSIONALS, USERS, PROJECT, CLIENT, DRAWINGS, SITE_VISITS and TESTING.
In MongoDB, a link between two entities is stored as the `_id` of a document in the other collection.

```mermaid
erDiagram
    CLIENT ||--o{ PROJECT : COMMISSIONS
    PROFESSIONALS |o--o{ PROJECT : DESIGNS
    PROFESSIONALS |o--o{ PROJECT : DRAFTS
    PROJECT ||--o{ DRAWINGS : HAS
    PROJECT ||--o{ SITE_VISITS : HAS
    PROJECT ||--o{ TESTING : HAS
    PROFESSIONALS |o--o{ SITE_VISITS : CONDUCTS
    PROFESSIONALS |o--o{ TESTING : PERFORMS
    USERS |o--o| PROFESSIONALS : HAS_ACCOUNT
    USERS |o--o{ PROJECT : CREATES
    USERS |o--o{ DRAWINGS : UPLOADS

    PROFESSIONALS {
        string Professional_ID PK
        string Name
        string Role
        string Organization
        string Qualifications
        string Phone_No
        string Email
        string Notes
    }

    USERS {
        string Staff_ID PK "Generated automatically: U01, U02 ..."
        string Name
        string Professional_ID FK
    }

    PROJECT {
        string Project_ID PK
        string Name
        string Description
        string Location
        string Building_Type
        date Start_Date
        date Expected_Completion_Date
        date Actual_Completion_Date
        string Project_Duration
        string Project_Stage
        string Status
        string Priority
        string Main_Contractor
        string Completed_Activity_History
        string Notes
        string Client_ID FK
        string Design_Engineer_ID FK
        string Draughtsman_ID FK
        string Created_By FK
    }

    CLIENT {
        string Client_ID PK
        string Client_Name
        string Company
        string Contact_Person
        string Phone_No
        string Email
        string Address
        string Notes
    }

    DRAWINGS {
        string Drawing_Number PK
        string Title
        string Document_Type
        string Status
        string Revisions
        string Notes
        string Project_ID FK
        string Uploaded_By FK
    }

    SITE_VISITS {
        string Project_ID PK, FK "Part of the composite key"
        date Date PK "Part of the composite key"
        string Purpose
        string Status
        string Attending_Professionals
        string Inspection_Notes
        string Supporting_Documents
        string Followup_Actions
        string Visited_By FK
    }

    TESTING {
        string Certificate_Number PK
        date Certificate_Date
        string Tested_By FK
        string Measurements
        string Time
        date Test_Date
        string Test_Type
        string Results
        string Remark
        string Project_ID FK
    }
```

## Relationships

| Relationship | Entities | Meaning |
|---|---|---|
| COMMISSIONS | CLIENT 1 : N PROJECT | A client commissions many projects. Each project belongs to one client. |
| DESIGNS | PROFESSIONALS 1 : N PROJECT | A design engineer designs many projects. Each project has one design engineer. |
| DRAFTS | PROFESSIONALS 1 : N PROJECT | A draughtsman works on many projects. Each project has one draughtsman. |
| HAS | PROJECT 1 : N DRAWINGS | A project has many drawings. Each drawing belongs to one project. |
| HAS | PROJECT 1 : N SITE_VISITS | A project has many site visits. Each visit belongs to one project. |
| HAS | PROJECT 1 : N TESTING | A project has many test certificates. Each certificate belongs to one project. |
| CONDUCTS | PROFESSIONALS 1 : N SITE_VISITS | A professional conducts many site visits. |
| PERFORMS | PROFESSIONALS 1 : N TESTING | A professional performs many tests. |
| HAS_ACCOUNT | USERS 1 : 1 PROFESSIONALS | A professional can have one login account. |
| CREATES | USERS 1 : N PROJECT | A user creates many projects. |
| UPLOADS | USERS 1 : N DRAWINGS | A user uploads many drawing revisions. |

## Notes

* SITE_VISITS is a weak entity. It is identified by the composite key (Project_ID, Date).
* Every document also has `created_at` and `updated_at` (added by Mongoose).