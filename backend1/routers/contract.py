from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal
from crud import contract as crud_contract
from schemas.contract import ContractCreate, ContractOut

router = APIRouter(
    prefix="/contracts",
    tags=["contracts"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=ContractOut)
def create_contract(contract: ContractCreate, db: Session = Depends(get_db)):
    return crud_contract.create_contract(db, contract)

@router.get("/{contract_id}", response_model=ContractOut)
def get_contract_by_id(contract_id: int, db: Session = Depends(get_db)):
    return crud_contract.get_contract_by_id(db, contract_id)

@router.put("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, contract: ContractCreate, db: Session = Depends(get_db)):
    return crud_contract.update_contract(db, contract_id, contract)

@router.delete("/{contract_id}", response_model=ContractOut)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    return crud_contract.delete_contract(db, contract_id)

@router.get("/", response_model=List[ContractOut])
def read_contracts(db: Session = Depends(get_db)):
    return crud_contract.get_contracts(db) 