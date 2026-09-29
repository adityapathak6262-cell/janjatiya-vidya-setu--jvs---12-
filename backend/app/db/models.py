import uuid
from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Text,
    Index,
    Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="STUDENT") # STUDENT, INSTITUTION_VERIFIER, MOTA_OFFICER, ADMIN, SUPER_ADMIN
    institution = Column(String(255), nullable=True)
    state = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applications = relationship("Application", back_populates="applicant")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Scheme(Base):
    __tablename__ = "schemes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, index=True, nullable=False) # NFST, NOS, PRE_MATRIC, POST_MATRIC
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    ministry = Column(String(255), default="Ministry of Tribal Affairs (MoTA)")
    created_at = Column(DateTime, default=datetime.utcnow)

    policy_versions = relationship("PolicyVersion", back_populates="scheme")
    applications = relationship("Application", back_populates="scheme")


class PolicyVersion(Base):
    __tablename__ = "policy_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scheme_id = Column(UUID(as_uuid=True), ForeignKey("schemes.id"), nullable=False)
    version_number = Column(String(50), nullable=False) # e.g. 2026-27 v2.0
    academic_year = Column(String(50), nullable=False) # e.g. 2026-27
    status = Column(String(50), nullable=False, default="DRAFT") # DRAFT, UNDER_REVIEW, APPROVED, PUBLISHED, RETIRED
    effective_date = Column(DateTime, default=datetime.utcnow)
    config = Column(JSON, nullable=False) # Structured rules: eligibility, fields, docs, verification, workflow, selection, milestones
    notes = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)
    published_by = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    scheme = relationship("Scheme", back_populates="policy_versions")
    applications = relationship("Application", back_populates="policy_version")

    __table_args__ = (
        Index("idx_policy_scheme_version", "scheme_id", "version_number"),
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_number = Column(String(100), unique=True, index=True, nullable=False)
    scheme_id = Column(UUID(as_uuid=True), ForeignKey("schemes.id"), nullable=False)
    policy_version_id = Column(UUID(as_uuid=True), ForeignKey("policy_versions.id"), nullable=False)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT") 
    # DRAFT, SUBMITTED, ELIGIBILITY_CHECK, VERIFICATION, DEFICIENCY, RESUBMITTED, RE_VERIFICATION, READY_FOR_SCRUTINY, SCRUTINY, SCREENING, SELECTED, NOT_SELECTED, POST_SELECTION, COMPLETED
    field_values = Column(JSON, nullable=False)
    timeline = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    applicant = relationship("User", back_populates="applications")
    scheme = relationship("Scheme", back_populates="applications")
    policy_version = relationship("PolicyVersion", back_populates="applications")
    documents = relationship("Document", back_populates="application")
    deficiencies = relationship("Deficiency", back_populates="application")
    verification_cases = relationship("VerificationCase", back_populates="application")
    scrutiny_cases = relationship("ScrutinyCase", back_populates="application")
    selection_decisions = relationship("SelectionDecision", back_populates="application")
    milestones = relationship("PostSelectionMilestone", back_populates="application")


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    storage_ref = Column(String(500), nullable=False)
    sha256_hash = Column(String(64), nullable=False, index=True)
    ocr_extracted_data = Column(JSON, nullable=True)
    verification_status = Column(String(50), default="PENDING")
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="documents")


class VerificationCase(Base):
    __tablename__ = "verification_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    verifier_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    verification_stage = Column(String(50), nullable=False) # INSTITUTE_LEVEL, MOTA_LEVEL
    path_a_evidence = Column(JSON, nullable=False)
    path_b_credential = Column(JSON, nullable=False)
    overall_status = Column(String(50), nullable=False) # VERIFIED, INCOMPLETE, INCONSISTENT, FLAGGED, REQUIRES_REVIEW, FAILED
    flags = Column(JSON, nullable=False, default=list)
    explanations = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="verification_cases")


class Deficiency(Base):
    __tablename__ = "deficiencies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    requirement_key = Column(String(100), nullable=False)
    document_key = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    what_explanation = Column(Text, nullable=False)
    why_explanation = Column(Text, nullable=False)
    action_required = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN") # OPEN, RESUBMITTED, RESOLVED
    student_remark = Column(Text, nullable=True)
    replacement_document_id = Column(UUID(as_uuid=True), nullable=True)
    raised_by = Column(String(255), nullable=False)
    raised_at = Column(DateTime, default=datetime.utcnow)
    resubmitted_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="deficiencies")


class ScrutinyCase(Base):
    __tablename__ = "scrutiny_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewer_name = Column(String(255), nullable=False)
    score = Column(Float, nullable=False)
    recommendation = Column(String(50), nullable=False) # RECOMMENDED, SHORTLISTED, WAITLISTED, NOT_RECOMMENDED
    committee_remarks = Column(Text, nullable=True)
    priority_criteria_met = Column(JSON, nullable=False, default=list)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="scrutiny_cases")


class SelectionDecision(Base):
    __tablename__ = "selection_decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    decision = Column(String(50), nullable=False) # SELECTED, NOT_SELECTED, WAITLISTED
    quota_category = Column(String(50), nullable=False) # DIVYANGJAN, PVTG, FEMALE, ST_OTHERS
    annual_award_amount = Column(String(100), nullable=False)
    award_letter_ref = Column(String(100), nullable=True)
    remarks = Column(Text, nullable=True)
    decided_by = Column(String(255), nullable=False)
    decided_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="selection_decisions")


class PostSelectionMilestone(Base):
    __tablename__ = "post_selection_milestones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=False)
    milestone_key = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, SUBMITTED, VERIFIED, OVERDUE
    required_document = Column(String(100), nullable=False)
    submitted_document_ref = Column(String(500), nullable=True)
    remarks = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    application = relationship("Application", back_populates="milestones")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="INFO") # INFO, ACTION_REQUIRED, SUCCESS, WARNING
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Grievance(Base):
    __tablename__ = "grievances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(50), unique=True, index=True, nullable=False)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id"), nullable=True)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    student_name = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN") # OPEN, UNDER_REVIEW, RESPONDED, RESOLVED
    officer_reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_index = Column(Integer, nullable=False, unique=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    previous_hash = Column(String(64), nullable=False)
    current_hash = Column(String(64), nullable=False, index=True)

    actor = relationship("User", back_populates="audit_logs")
