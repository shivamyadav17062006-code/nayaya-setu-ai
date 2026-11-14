# Entity Relationship Model — NyayaSaathi (न्यायसाथी)

This document visualizes the complete relational data model of NyayaSaathi across all 14 tables.

---

## 1. Complete Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    users ||--o{ conversations : "owns"
    conversations ||--|{ messages : "contains"

    legal_acts ||--|{ legal_sections : "contains"

    legal_sections ||--o{ section_beneficiaries : "protects"
    beneficiaries ||--o{ section_beneficiaries : "applies_to"

    legal_sections ||--o{ section_categories : "categorized_under"
    right_categories ||--o{ section_categories : "groups"

    right_categories ||--o{ complaint_workflows : "relates_to"
    complaint_workflows ||--|{ workflow_steps : "defines"

    legal_sections ||--o{ legal_remedies : "offers"
    legal_sections ||--o{ legal_chunks : "vectorized_into"

    legal_aid_providers {
        uuid id PK
        string name
        string provider_type
        string state
        string district
        boolean is_active
        boolean verified
    }

    users {
        uuid id PK
        string email UK
        string phone UK
        string role
        string language
        timestamptz created_at
    }

    conversations {
        uuid id PK
        string session_id UK
        uuid user_id FK
        string language
        timestamptz created_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        string role
        text content
        jsonb metadata
        timestamptz created_at
    }

    legal_acts {
        uuid id PK
        string title
        int year
        string jurisdiction
        string category
        string verification_status
    }

    legal_sections {
        uuid id PK
        uuid act_id FK
        string section_number
        string section_title
        text original_text
        text simplified_text
    }

    beneficiaries {
        uuid id PK
        string name UK
        string slug UK
        string icon
    }

    right_categories {
        uuid id PK
        string name UK
        string slug UK
        string icon
    }

    section_beneficiaries {
        uuid section_id PK,FK
        uuid beneficiary_id PK,FK
    }

    section_categories {
        uuid section_id PK,FK
        uuid category_id PK,FK
    }

    complaint_workflows {
        uuid id PK
        string title
        string category
        uuid category_id FK
        string jurisdiction
        string target_authority
    }

    workflow_steps {
        uuid id PK
        uuid workflow_id FK
        int step_number
        string title
        text instructions
        string authority
    }

    legal_remedies {
        uuid id PK
        uuid section_id FK
        string remedy_type
        string title
        text description
    }

    legal_chunks {
        uuid id PK
        uuid section_id FK
        text content
        int chunk_number
        string language
        vector embedding
    }
```

---

## 2. Relationship Cardinality Matrix

| Source Entity | Foreign Key Column | Target Entity | Referenced Column | Cardinality | `ON DELETE` Action | Business Description |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `conversations` | `user_id` | `users` | `id` | Many-to-One (0..* : 1) | `SET NULL` | A user can own multiple chat sessions. Guest sessions have `user_id = NULL`. |
| `messages` | `conversation_id` | `conversations` | `id` | Many-to-One (1..* : 1) | `CASCADE` | Dialogue messages belong to one conversation; deleting a conversation cleans up all messages. |
| `legal_sections` | `act_id` | `legal_acts` | `id` | Many-to-One (1..* : 1) | `CASCADE` | Sections belong to one Act; deleting an Act cascades to its sections. |
| `section_beneficiaries`| `section_id` | `legal_sections` | `id` | Many-to-One | `CASCADE` | Junction table associating sections with target beneficiary groups. |
| `section_beneficiaries`| `beneficiary_id`| `beneficiaries` | `id` | Many-to-One | `CASCADE` | Junction table associating sections with target beneficiary groups. |
| `section_categories` | `section_id` | `legal_sections` | `id` | Many-to-One | `CASCADE` | Junction table associating sections with broad right categories. |
| `section_categories` | `category_id` | `right_categories`| `id` | Many-to-One | `CASCADE` | Junction table associating sections with broad right categories. |
| `complaint_workflows` | `category_id` | `right_categories`| `id` | Many-to-One (0..* : 1) | `SET NULL` | Workflows relate to a right category; removing a category does not delete the procedure. |
| `workflow_steps` | `workflow_id` | `complaint_workflows` | `id` | Many-to-One (1..* : 1) | `CASCADE` | Steps belong to a workflow; removing a workflow purges its step sequence. |
| `legal_remedies` | `section_id` | `legal_sections` | `id` | Many-to-One (0..* : 1) | `CASCADE` | Specific remedies (e.g. damages, complaint) associated with a statutory section. |
| `legal_chunks` | `section_id` | `legal_sections` | `id` | Many-to-One (0..* : 1) | `CASCADE` | AI vector chunk passages tied to a statutory section for grounded retrieval. |

---

## 3. Key Normalization Guarantees

1. **Third Normal Form (3NF)**:
   - All transitive dependencies removed. Junction tables `section_beneficiaries` and `section_categories` handle Many-to-Many relationships cleanly.
   - Text descriptions are separated from junction relationships.
2. **Statutory Truth vs. AI Grounding Separation**:
   - `legal_sections` holds the authoritative statutory provisions (`original_text` verbatim from Indian statutes, alongside plain-language `simplified_text`).
   - `legal_chunks` stores the sliced and embedded vectors strictly for semantic search indexing. The AI engine never mutates `legal_sections`.
3. **Session Ownership & Authentication Lifecycle**:
   - Conversations are referenced by a durable `session_id` string for anonymous guest users.
   - Upon authentication, `userId` is updated without breaking existing message history or forcing a schema reset.
