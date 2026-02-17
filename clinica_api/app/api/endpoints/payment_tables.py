import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.payment_table_model import PaymentTable
from app.schemas.payment_table import PaymentTable as PaymentTableSchema
from app.schemas.payment_table import PaymentTableCreate

router = APIRouter()


@router.get("/", response_model=List[PaymentTableSchema])
def read_payment_tables(session: Session = Depends(get_session)):
    tables = session.exec(select(PaymentTable)).all()
    return tables


@router.post("/", response_model=PaymentTableSchema)
def create_payment_table(
    table_in: PaymentTableCreate, session: Session = Depends(get_session)
):
    new_table = PaymentTable(
        id=str(uuid.uuid4()), name=table_in.name, value=table_in.value
    )
    session.add(new_table)
    session.commit()
    session.refresh(new_table)
    return new_table


@router.put("/{table_id}", response_model=PaymentTableSchema)
def update_payment_table(
    table_id: str, table_in: PaymentTableCreate, session: Session = Depends(get_session)
):
    table = session.get(PaymentTable, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Payment Table not found")

    table.name = table_in.name
    table.value = table_in.value

    session.add(table)
    session.commit()
    session.refresh(table)
    return table


@router.delete("/{table_id}", status_code=204)
def delete_payment_table(table_id: str, session: Session = Depends(get_session)):
    table = session.get(PaymentTable, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Payment Table not found")

    session.delete(table)
    session.commit()
    return
