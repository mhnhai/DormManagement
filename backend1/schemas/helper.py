from typing import TypeVar, Generic, List

from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

    class Config:
        orm_mode = True
