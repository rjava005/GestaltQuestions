from enum import Enum
from typing import (
    Any,
    Dict,
    Iterable,
    List,
    Literal,
    Sequence,
    Type,
    TypeVar,
)

from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.inspection import inspect
from sqlalchemy.orm.properties import RelationshipProperty
from sqlmodel import SQLModel, select

from src.core import SessionDep, logger


T = TypeVar("T", bound=SQLModel)


async def get_or_create_many(
    session: SessionDep, model: Type[T], names: Sequence[str], lookup_field="name"
) -> List[T]:
    if model is None:
        logger.error(f"MODEL PASSED: {model=} ({type(model)=})")
        raise RuntimeError("get_or_create_many received model=None")

    if not hasattr(model, lookup_field):
        raise ValueError(f"Model {model} does not have attribute {lookup_field}")
    results = []
    try:
        for name in names:
            stmt = select(model).where(
                func.lower(getattr(model, lookup_field)) == name.lower()
            )
            obj = session.exec(stmt).one_or_none()
            if not obj:
                obj = model(**{lookup_field: name})
                session.add(obj)
                session.flush()
            results.append(obj)
        return results
    except SQLAlchemyError as e:
        session.rollback()
        logger.error(f"[DB] could not create {model} {e}")
        raise ValueError(f"[DB] failed to create {model} an error occured {e}")


NormalizeMode = Literal["auto", "list", "scalar"]


async def get_relationship_data(
    model: SQLModel,
    rel_name: str,
    *,
    attr: str = "name",
    mode: NormalizeMode = "auto",
):
    """
    Extract attribute(s) from a SQLModel relationship.

    mode:
      - "auto"   → list if relationship is iterable, else scalar
      - "list"   → always returns list
      - "scalar" → always returns scalar (raises if multiple)
    """

    if not hasattr(model, rel_name):
        raise ValueError(f"{model.__class__.__name__} has no relationship '{rel_name}'")
    relationship_data = getattr(model, rel_name)

    if relationship_data is None:
        return [] if mode == "list" else None

    def extract(obj: Any) -> Any:
        if not hasattr(obj, attr):
            raise ValueError(f"{obj.__class__.__name__} has no attribute '{attr}'")
        return getattr(obj, attr)

    # Handle iterable relationships (list, InstrumentedList)
    if isinstance(relationship_data, Iterable) and not isinstance(
        relationship_data, (str, bytes)
    ):
        values = [extract(r) for r in relationship_data]

        if mode == "scalar":
            if len(values) != 1:
                raise ValueError(
                    f"Expected single related object for '{rel_name}', got {len(values)}"
                )
            return values[0]

        return values

    # Scalar relationship
    value = extract(relationship_data)

    if mode == "list":
        return [value]

    return value


def get_all_model_relationships(model: Type[SQLModel]) -> Dict[str, Type[SQLModel]]:
    mapper = inspect(model)
    relationships = {}
    for name, rel in mapper.relationships.items():
        relationships[name] = rel.mapper.class_
    return relationships


def get_all_model_relationship_data(
    model: SQLModel, base_model: Type[SQLModel], excluded_relationship: List[str] = []
) -> Dict[str, Any]:
    all_relationships = get_all_model_relationships(base_model)
    data = {}
    for r in all_relationships:
        if r in excluded_relationship:
            continue
        logger.debug(f"[Generic DB] This is the relationship info {r}")
        data[r] = getattr(model, r)
        logger.debug(f"[Generic DB] This is the relationship data {data[r]}")
    return data


def is_relationship(model: Type[SQLModel], attr_name: str) -> bool:
    """True if model.attr_name is a relationship."""
    try:
        prop = inspect(model).get_property(attr_name)
        return isinstance(prop, RelationshipProperty)
    except Exception as e:
        return False


def filter_conditional(
    model: Type[SQLModel], col_key: str, value: Any, partial: bool = True
):
    column = getattr(model, col_key)

    if isinstance(value, bool):
        return column.is_(value)

    if isinstance(value, (int, float)):
        return column == value

    if isinstance(value, Enum):
        return column.lower == value.value

    if partial:
        # Case-insensitive partial match
        return func.lower(column).like(f"%{value.lower()}%")
    else:
        # Case-insensitive exact match
        return func.lower(column) == value.lower()
