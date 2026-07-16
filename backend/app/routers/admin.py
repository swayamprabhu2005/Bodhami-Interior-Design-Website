"""Admin Router — analytics, project management, inquiry CRM."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from ..db import get_db
from ..models import User, Project, Quotation, Inquiry, Vendor, Package, Product

router = APIRouter()


@router.get("/stats", summary="Overall platform analytics")
def get_stats(db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    total_quotations = db.query(Quotation).count()
    total_inquiries = db.query(Inquiry).count()
    total_vendors = db.query(Vendor).count()

    budgets = db.query(Project.budget).all()
    revenue_pipeline = sum(b[0] for b in budgets if b[0])

    status_rows = db.query(Project.status, func.count(Project.id)).group_by(Project.status).all()
    projects_by_status = {s: c for s, c in status_rows}

    inq_rows = db.query(Inquiry.status, func.count(Inquiry.id)).group_by(Inquiry.status).all()
    inquiries_by_status = {s: c for s, c in inq_rows}

    return {
        "total_users": total_users,
        "total_projects": total_projects,
        "total_quotations": total_quotations,
        "total_inquiries": total_inquiries,
        "total_vendors": total_vendors,
        "revenue_pipeline": revenue_pipeline,
        "projects_by_status": projects_by_status,
        "inquiries_by_status": inquiries_by_status,
    }


@router.get("/projects", summary="List all projects (admin view)")
def list_all_projects(
    status: Optional[str] = Query(None),
    bhk: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Project).order_by(Project.created_at.desc())
    if status:
        q = q.filter(Project.status == status)
    if bhk:
        q = q.filter(Project.bhk_type == bhk)
    projects = q.limit(limit).all()
    return {
        "projects": [_project_admin_out(p, db) for p in projects],
        "total": len(projects),
    }


@router.put("/projects/{project_id}/status", summary="Update project status (admin)")
def admin_update_status(project_id: str, payload: dict, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(404, "Project not found")
    if "status" in payload:
        project.status = payload["status"]
    db.commit()
    return {"message": "updated", "new_status": project.status}


@router.get("/users", summary="List all users (admin)")
def list_users(limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).limit(limit).all()
    return {
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "phone": u.phone,
                "email": u.email,
                "city": u.city,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "project_count": db.query(Project).filter(Project.user_id == u.id).count(),
            }
            for u in users
        ],
        "total": len(users),
    }


@router.get("/inquiries", summary="List all inquiries (admin)")
def list_admin_inquiries(
    status: Optional[str] = Query(None),
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Inquiry).order_by(Inquiry.created_at.desc())
    if status:
        q = q.filter(Inquiry.status == status)
    inquiries = q.limit(limit).all()
    return {
        "inquiries": [
            {
                "id": i.id,
                "name": i.name,
                "phone": i.phone,
                "email": i.email,
                "city": i.city,
                "bhk_type": i.bhk_type,
                "message": i.message,
                "project_id": i.project_id,
                "status": i.status,
                "source": i.source,
                "created_at": i.created_at.isoformat() if i.created_at else None,
            }
            for i in inquiries
        ],
        "total": len(inquiries),
    }


@router.put("/inquiries/{inquiry_id}", summary="Update inquiry status (admin)")
def admin_update_inquiry(inquiry_id: str, payload: dict, db: Session = Depends(get_db)):
    inq = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inq:
        from fastapi import HTTPException
        raise HTTPException(404, "Inquiry not found")
    for field in ["status"]:
        if field in payload:
            setattr(inq, field, payload[field])
    db.commit()
    return {"message": "updated"}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _project_admin_out(p: Project, db: Session) -> dict:
    user = db.query(User).filter(User.id == p.user_id).first()
    pkg = db.query(Package).filter(Package.id == p.package_id).first() if p.package_id else None
    return {
        "id": p.id,
        "bhk_type": p.bhk_type,
        "property_name": p.property_name,
        "city": p.city,
        "budget": p.budget,
        "status": p.status,
        "package_name": pkg.name if pkg else None,
        "package_tier": pkg.tier if pkg else None,
        "customer_name": user.name if user else None,
        "customer_phone": user.phone if user else None,
        "customer_email": user.email if user else None,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
