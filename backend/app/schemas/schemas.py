from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "STUDENT" # STUDENT, INSTITUTION_VERIFIER, MOTA_OFFICER, ADMIN, SUPER_ADMIN
    institution: Optional[str] = None
    state: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: uuid.UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    token: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Scheme & Policy Schemas
class SchemeBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: str
    ministry: str = "Ministry of Tribal Affairs (MoTA)"

class SchemeCreate(SchemeBase):
    pass

class PolicyVersionBase(BaseModel):
    version_number: str
    academic_year: str
    effective_date: Optional[datetime] = None
    config: Dict[str, Any]
    notes: Optional[str] = None

class PolicyVersionCreate(PolicyVersionBase):
    scheme_id: uuid.UUID

class PolicyVersionResponse(PolicyVersionBase):
    id: uuid.UUID
    scheme_id: uuid.UUID
    scheme_code: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    published_by: Optional[str] = None
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SchemeResponse(SchemeBase):
    id: uuid.UUID
    created_at: datetime
    versions: List[PolicyVersionResponse] = []
    active_version: Optional[PolicyVersionResponse] = None

    class Config:
        from_attributes = True

class PolicyExtractRequest(BaseModel):
    scheme_code: str
    academic_year: str = "2026-27"
    raw_guideline_text: Optional[str] = None
    guideline_preset_key: Optional[str] = None

# Application Schemas
class ApplicationCreate(BaseModel):
    scheme_code: str
    policy_version_id: uuid.UUID
    field_values: Dict[str, Any]
    submit_now: bool = False

class ApplicationUpdate(BaseModel):
    field_values: Optional[Dict[str, Any]] = None
    submit_now: Optional[bool] = None

class ApplicationResponse(BaseModel):
    id: uuid.UUID
    application_number: str
    scheme_id: uuid.UUID
    scheme_code: Optional[str] = None
    scheme_name: Optional[str] = None
    policy_version_id: uuid.UUID
    policy_version_number: Optional[str] = None
    academic_year: str
    applicant_id: uuid.UUID
    applicant_name: Optional[str] = None
    status: str
    field_values: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Document Schemas
class DocumentUpload(BaseModel):
    application_id: uuid.UUID
    document_type: str
    file_name: str
    mime_type: Optional[str] = "application/pdf"
    file_data_base64: Optional[str] = None
    field_values_to_cross_check: Optional[Dict[str, Any]] = None

class DocumentResponse(BaseModel):
    id: uuid.UUID
    application_id: uuid.UUID
    document_type: str
    file_name: str
    mime_type: str
    file_size_bytes: int
    storage_ref: str
    sha256_hash: str
    ocr_extracted_data: Optional[Dict[str, Any]] = None
    verification_status: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

# Verification Schemas
class VerificationDecisionRequest(BaseModel):
    application_id: uuid.UUID
    decision: str # VERIFY_APPROVE, MARK_DEFECTIVE, REJECT
    remarks: Optional[str] = None
    deficiencies_to_raise: Optional[List[Dict[str, Any]]] = None

class DeficiencyResubmitRequest(BaseModel):
    student_remark: str
    replacement_document_id: Optional[uuid.UUID] = None

# Scrutiny & Selection Schemas
class ScrutinyReviewRequest(BaseModel):
    application_id: uuid.UUID
    score: float
    recommendation: str # RECOMMENDED, SHORTLISTED, WAITLISTED, NOT_RECOMMENDED
    committee_remarks: str
    priority_criteria_met: List[str] = []

class SelectionDecisionRequest(BaseModel):
    application_id: uuid.UUID
    decision: str # SELECTED, NOT_SELECTED, WAITLISTED
    quota_category: str # DIVYANGJAN, PVTG, FEMALE, ST_OTHERS
    annual_award_amount: str
    remarks: Optional[str] = None

# Audit Schemas
class AuditBlockResponse(BaseModel):
    id: uuid.UUID
    event_index: int
    timestamp: datetime
    actor_user_id: Optional[uuid.UUID] = None
    actor_role: str
    action: str
    entity_type: str
    entity_id: str
    payload: Dict[str, Any]
    previous_hash: str
    current_hash: str

    class Config:
        from_attributes = True

# Grievance
class GrievanceCreate(BaseModel):
    application_id: Optional[uuid.UUID] = None
    subject: str
    category: str = "Verification Query"
    message: str

class GrievanceResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    application_id: Optional[uuid.UUID] = None
    student_name: str
    subject: str
    category: str
    message: str
    status: str
    officer_reply: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
