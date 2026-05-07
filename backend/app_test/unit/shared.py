from typing import Union

FileContent = Union[str, dict, bytes]

USERS = [
    {
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alice",
        "email": "alice@test.com",
    },
    {
        "first_name": "Bob",
        "last_name": "Jones",
        "username": "bob",
        "email": "bob@test.com",
    },
]

INVALID_USERS = [
    {
        "last_name": "Smith",
        "username": "alice",
        "email": "alice_test.com",
    },
    {
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alice",
        "email": "not-an-email",
    },
]

# Storage test fixtures: intentionally small for fast test execution.

STORAGE_CREATE_TARGETS = (
    "questions/",
    "data/user1234/content/question1/",
)
TARGETS = STORAGE_CREATE_TARGETS

STORAGE_RENAME_DIR_CASES = (
    ("questions/draft/", "questions/published/"),
    ("questions/temp/", "questions/archive/"),
)
RENAME_DIR = STORAGE_RENAME_DIR_CASES

STORAGE_RENAME_PATH_CASES = [
    ("questions/test1.txt", "questions/test1_renamed.txt"),
    ("questions/module1/", "questions/module1_updated/"),
    ("archive/", "archive_old/"),
    ("questions/file.txt", "questions/archive/file.txt"),
]
RENAME_TARGETS = STORAGE_RENAME_PATH_CASES

STORAGE_FILE_CASES: list[tuple[str, FileContent]] = [
    ("text.txt", "Hello World"),
    ("data.json", {"key": "value"}),
    ("binary.bin", b"\x00\x01\x02"),
    ("path/to/file.txt", "Nested path content"),
]
MOCK_FILES = STORAGE_FILE_CASES

STORAGE_FOLDER_ITERATION_CASES: list[tuple[str, list[tuple[str, FileContent]]]] = [
    (
        "questions/",
        [
            ("questions/a.txt", "A"),
            ("questions/b.json", {"x": 1}),
            ("questions/c.bin", b"\x00\x01"),
        ],
    ),
    (
        "archive/",
        [
            ("archive/root.txt", "root file"),
            ("archive/sub/a.txt", "sub file"),
        ],
    ),
]
FOLDER_ITERATION_TARGETS = STORAGE_FOLDER_ITERATION_CASES

STORAGE_NON_RECURSIVE_FOLDER_CASES: list[
    tuple[str, list[tuple[str, FileContent]], list[str]]
] = [
    (
        "questions/",
        [
            ("questions/a.txt", "A"),
            ("questions/b.json", {"x": 1}),
            ("questions/sub/c.txt", "nested"),
        ],
        [
            "questions/a.txt",
            "questions/b.json",
        ],
    ),
    (
        "archive/",
        [
            ("archive/root.txt", "root file"),
            ("archive/sub/a.txt", "sub file"),
        ],
        [
            "archive/root.txt",
        ],
    ),
]
NON_RECURSIVE_FOLDER_ITERATION_TARGETS = STORAGE_NON_RECURSIVE_FOLDER_CASES
