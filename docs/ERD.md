# Database design (ER diagram)

MongoDB collections and how they are linked. A link stores the `_id` of a document in another collection.

```mermaid
erDiagram
    CLIENT |o--o{ PROJECT : "client"
    PROFESSIONAL |o--o{ PROJECT : "design_engineer"
    PROFESSIONAL |o--o{ PROJECT : "draughtsman"
    USER |o--o{ PROJECT : "created_by"

    USER {
        ObjectId _id PK
        string full_name
        string officer_id UK
        string staff_code UK
        string password_hash
    }
    CLIENT {
        ObjectId _id PK
        string name
        string company
        string contact_person
        string phone
        string email
        string address
        string notes
    }
    PROFESSIONAL {
        ObjectId _id PK
        string name
        string role
        string organization
        string phone
        string email
        string notes
    }
    PROJECT {
        ObjectId _id PK
        string project_code UK
        string name
        ObjectId client FK
        string building_type
        string status
        string priority
        date start_date
        date expected_completion_date
        date actual_completion_date
        ObjectId design_engineer FK
        ObjectId draughtsman FK
        ObjectId created_by FK
        string location
        string description
        string project_stage
        string consulting_organization
        string project_duration
        string activity_history
        string main_contractor
        string notes
    }
```

Notes
* One client can have many projects. One professional can work on many projects (as design engineer or draughtsman).
* The links are optional. If a client or professional is deleted, the API sets that link to `null` on its projects. The projects are not deleted.
* Every document also has `created_at` and `updated_at` (added by Mongoose).
* Not built yet: drawings, site visits, tenders, material approvals, testing, payments. Each would link to a project.
