from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.core.database import get_session
from app.models.appointment_model import Appointment
from app.models.transaction_model import Transaction, TransactionType
from app.schemas.transaction import (DailyStats, TransactionCreate,
                                     TransactionResponse, TransactionUpdate)

router = APIRouter()


def recalculate_appointment_financials(session: Session, appointment_id: str):
    """
    Recalculates amount_paid and payment_status for an appointment based on its transactions.
    """
    if not appointment_id:
        return

    # Fetch appointment
    appt = session.get(Appointment, appointment_id)
    if not appt:
        return

    # Fetch all transactions for this appointment
    query = select(Transaction).where(Transaction.appointment_id == appointment_id)
    transactions = session.exec(query).all()

    # Sum payments (INCOME only?)
    total_paid = 0.0
    debug_log = f"Recalc Appt {appointment_id}:\n"

    for t in transactions:
        # Robust comparison: handle Enum or String
        t_type = (
            str(t.type).split(".")[-1] if "." in str(t.type) else str(t.type)
        )  # Handle TransactionType.INCOME or "INCOME"

        debug_log += f" - Tx {t.id}: {t.amount} ({t_type})\n"

        if t_type == "INCOME":
            total_paid += t.amount
        elif t_type == "EXPENSE":
            total_paid -= t.amount

    appt.amount_paid = total_paid

    # Update Status
    price = appt.price or 0.0
    debug_log += f" - TotalPaid: {total_paid}, Price: {price}\n"

    # Floating point tolerance
    has_income_transaction = any(
        (str(t.type).split(".")[-1] if "." in str(t.type) else str(t.type)) == "INCOME"
        for t in transactions
    )

    if price > 0 and total_paid >= (price - 0.01):
        appt.payment_status = "PAID"
    elif price == 0 and has_income_transaction:
        # Gratuidade: Transaction happened (even if 0.00), so it is settled/paid
        appt.payment_status = "PAID"
    elif total_paid > 0:
        appt.payment_status = "PARTIAL"
    else:
        appt.payment_status = "PENDING"

    debug_log += f" - NewStatus: {appt.payment_status}\n"

    # Write debug log to file
    try:
        with open("recalc_debug.log", "a") as f:
            f.write(debug_log + "\n")
    except:
        pass

    session.add(appt)
    session.commit()
    session.refresh(appt)


@router.post("/transactions", response_model=TransactionResponse)
def create_transaction(
    transaction: TransactionCreate, session: Session = Depends(get_session)
):
    db_transaction = Transaction.model_validate(transaction)
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)

    # Recalculate Appointment if linked
    if db_transaction.appointment_id:
        recalculate_appointment_financials(session, db_transaction.appointment_id)

    return db_transaction


@router.get("/transactions/detail/{transaction_id}", response_model=Transaction)
def get_transaction(transaction_id: str, session: Session = Depends(get_session)):
    transaction = session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.get("/transactions", response_model=List[TransactionResponse])
def get_transactions(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    date_filter: Optional[date] = None,
    patient_id: Optional[str] = None,
    appointment_id: Optional[str] = None,
    session: Session = Depends(get_session),
):
    query = select(Transaction)

    # Handle backward compatibility: if date_filter is present, treat as start=end=date_filter
    if date_filter:
        query = query.where(func.date(Transaction.date) == date_filter)
    else:
        # Range filtering
        if start_date:
            query = query.where(func.date(Transaction.date) >= start_date)
        if end_date:
            query = query.where(func.date(Transaction.date) <= end_date)

    if patient_id:
        query = query.where(Transaction.patient_id == patient_id)

    if appointment_id:
        query = query.where(Transaction.appointment_id == appointment_id)

    query = query.order_by(Transaction.date.desc())
    return session.exec(query).all()


@router.get("/stats/daily", response_model=DailyStats)
def get_daily_stats(target_date: date, session: Session = Depends(get_session)):
    query = select(Transaction).where(func.date(Transaction.date) == target_date)
    transactions = session.exec(query).all()

    total_income = sum(
        t.amount for t in transactions if t.type == TransactionType.INCOME
    )
    total_expense = sum(
        t.amount for t in transactions if t.type == TransactionType.EXPENSE
    )

    by_method = {}
    for t in transactions:
        if t.type == TransactionType.INCOME:
            method = t.payment_method.value
            by_method[method] = by_method.get(method, 0) + t.amount

    return DailyStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transaction_count=len(transactions),
        by_method=by_method,
    )


@router.get("/stats/summary", response_model=DailyStats)
def get_financial_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    session: Session = Depends(get_session),
):
    query = select(Transaction)

    if start_date:
        query = query.where(func.date(Transaction.date) >= start_date)

    if end_date:
        query = query.where(func.date(Transaction.date) <= end_date)

    transactions = session.exec(query).all()

    total_income = sum(
        t.amount for t in transactions if t.type == TransactionType.INCOME
    )
    total_expense = sum(
        t.amount for t in transactions if t.type == TransactionType.EXPENSE
    )

    by_method = {}
    for t in transactions:
        if t.type == TransactionType.INCOME:
            method = t.payment_method.value
            by_method[method] = by_method.get(method, 0) + t.amount

    return DailyStats(
        total_income=total_income,
        total_expense=total_expense,
        balance=total_income - total_expense,
        transaction_count=len(transactions),
        by_method=by_method,
    )


@router.delete("/transactions/{id}")
def delete_transaction(id: str, session: Session = Depends(get_session)):
    transaction = session.get(Transaction, id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    appt_id = transaction.appointment_id

    session.delete(transaction)
    session.commit()

    # Recalculate Appointment if linked
    if appt_id:
        recalculate_appointment_financials(session, appt_id)

    return {"ok": True}


@router.put("/transactions/{id}", response_model=TransactionResponse)
def update_transaction(
    id: str, transaction_in: TransactionUpdate, session: Session = Depends(get_session)
):
    db_transaction = session.get(Transaction, id)
    if not db_transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    data = transaction_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(db_transaction, key, value)

    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)

    if db_transaction.appointment_id:
        recalculate_appointment_financials(session, db_transaction.appointment_id)

    return db_transaction
