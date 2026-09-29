import hashlib
import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.models import AuditLog

async def append_audit_block(
    session: AsyncSession,
    actor_user_id: Optional[Any],
    actor_role: str,
    action: str,
    entity_type: str,
    entity_id: str,
    payload: Dict[str, Any]
) -> AuditLog:
    # Get last block to determine index and previous hash
    query = select(AuditLog).order_by(AuditLog.event_index.desc()).limit(1)
    result = await session.execute(query)
    last_block = result.scalar_one_or_none()

    if last_block is None:
        event_index = 0
        previous_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    else:
        event_index = last_block.event_index + 1
        previous_hash = last_block.current_hash

    timestamp = datetime.utcnow()
    
    # Deterministic block string
    block_content = {
        "event_index": event_index,
        "timestamp": timestamp.isoformat(),
        "actor_user_id": str(actor_user_id) if actor_user_id else None,
        "actor_role": actor_role,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "payload": payload,
        "previous_hash": previous_hash
    }
    
    serialized = json.dumps(block_content, sort_keys=True)
    current_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    audit_entry = AuditLog(
        event_index=event_index,
        timestamp=timestamp,
        actor_user_id=actor_user_id,
        actor_role=actor_role,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        payload=payload,
        previous_hash=previous_hash,
        current_hash=current_hash
    )
    
    session.add(audit_entry)
    await session.commit()
    await session.refresh(audit_entry)
    return audit_entry

async def verify_chain_integrity(session: AsyncSession) -> Dict[str, Any]:
    query = select(AuditLog).order_by(AuditLog.event_index.asc())
    result = await session.execute(query)
    blocks = result.scalars().all()

    if not blocks:
        return {"is_valid": True, "total_blocks": 0, "broken_index": None, "details": "Chain is empty"}

    for i, block in enumerate(blocks):
        expected_prev = "0000000000000000000000000000000000000000000000000000000000000000" if i == 0 else blocks[i - 1].current_hash
        
        if block.previous_hash != expected_prev:
            return {
                "is_valid": False,
                "total_blocks": len(blocks),
                "broken_index": i,
                "details": f"Broken pointer at block #{i}. Expected {expected_prev}, found {block.previous_hash}"
            }

        block_content = {
            "event_index": block.event_index,
            "timestamp": block.timestamp.isoformat(),
            "actor_user_id": str(block.actor_user_id) if block.actor_user_id else None,
            "actor_role": block.actor_role,
            "action": block.action,
            "entity_type": block.entity_type,
            "entity_id": block.entity_id,
            "payload": block.payload,
            "previous_hash": block.previous_hash
        }
        recomputed = hashlib.sha256(json.dumps(block_content, sort_keys=True).encode('utf-8')).hexdigest()

        if recomputed != block.current_hash:
            return {
                "is_valid": False,
                "total_blocks": len(blocks),
                "broken_index": i,
                "details": f"Cryptographic tamper detected at block #{i}!"
            }

    return {
        "is_valid": True,
        "total_blocks": len(blocks),
        "broken_index": None,
        "details": f"All {len(blocks)} blocks cryptographically validated."
    }
