# Backend Utils

Shared backend utilities are grouped by what they do. Prefer importing from
`backend.utils` for common helpers, or from a focused subpackage when you want
the source category to be explicit.

## Structure

```text
backend.utils
├── common
│   └── general helpers such as object/dict picking, response payload checks,
│       and filesystem-safe names
├── data
│   ├── conversion helpers for booleans, lists, JSON-like values, and serialized
│   │   Pydantic data
│   └── normalization helpers for names, content, newline handling, and
│       serializable output
├── database
│   ├── core database helpers such as UUID conversion, string filtering,
│   │   timestamp normalization, and SQLAlchemy type helpers
│   └── generic relationship/query helpers for SQLModel models
├── media
│   └── image encoding, decoding, and writing helpers
└── testing
    └── helpers used by tests, such as preparing upload payloads
```

## Preferred Imports

Use the top-level package for widely used helpers:

```python
from backend.utils import convert_uuid, normalize_content, safe_dir_name
```

Use focused imports when the category matters:

```python
from backend.utils.database import get_or_create_many
from backend.utils.media import encode_image
from backend.utils.testing import prepare_file_uploads
```

## Notes

- Keep utility functions small and domain-neutral.
- If a helper starts depending on auth, questions, storage, or another domain,
  it probably belongs in that domain package instead of `backend.utils`.
- If two utilities do the same thing, keep the clearer or more widely used one
  and remove the duplicate export.
- `backend.utils.__init__` should export the stable public utility surface.
