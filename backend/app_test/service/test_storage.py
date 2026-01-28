import pytest
from typing import Literal, Tuple
from pathlib import Path
from src.utils import normalize, normalize_newlines
from io import BytesIO


STORAGE_TYPE: Literal["local", "cloud"]


@pytest.fixture
def create_test_dir(active_storage_backend) -> Tuple[Path, str]:
    """Create a temporary test directory inside the local storage."""
    testdir = "TestFolder"
    created_dir = active_storage_backend.create_storage_path(testdir)
    print("[TEST] This is the created dir", created_dir)
    return created_dir, testdir


@pytest.fixture
def save_multiple_files(active_storage_backend, create_test_dir):
    """Save multiple test files (string, dict, bytes) under a temporary directory."""
    dir, name = create_test_dir
    files = [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict
        ("binary.bin", b"\x00\x01\x02"),  # bytes
    ]

    for filename, content in files:
        active_storage_backend.save_file(
            name,
            content,
            filename,
        )

    return dir


# -------------------------------------------------------------------------
# Initialization / Lifecycle
# -------------------------------------------------------------------------
def test_storage_initialization(active_storage_backend):
    """Verify both storage backends initialize correctly."""
    backend = active_storage_backend

    assert backend.get_root_path() is not None
    assert backend.get_base_path() is not None


# -------------------------------------------------------------------------
# base_path path operations
# -------------------------------------------------------------------------
def test_backend_properties(active_storage_backend, storage_mode, tmp_path):
    backend = active_storage_backend
    base = "questions"

    if storage_mode == "local":
        assert backend.get_root_path() == tmp_path.as_posix()
        assert backend.get_base_path() == (tmp_path / base).as_posix()

    if storage_mode == "cloud":
        root = "test"
        assert backend.get_root_path() == root
        assert backend.get_base_path() == (Path(root) / base).as_posix()


def test_get_relative_to_base(active_storage_backend):
    backend = active_storage_backend
    base = "questions"

    correct_path = f"{base}/MyQuestion"
    assert backend.get_relative_to_base(correct_path) == correct_path

    path_to_check = f"MyQuestion"
    assert backend.get_relative_to_base(path_to_check) == correct_path


def test_no_duplication(active_storage_backend):
    backend = active_storage_backend
    base = "questions"

    # Case: Passing the base itself should NOT get duplicated
    assert backend.get_relative_to_base(base) == base

    # Case: Passing a child path should remain unchanged
    assert backend.get_relative_to_base("questions/abc") == "questions/abc"

    # Case: Passing a plain identifier should get prefixed
    assert backend.get_relative_to_base("abc") == "questions/abc"


def test_get_storage_no_duplication(active_storage_backend, storage_mode, tmp_path):
    backend = active_storage_backend
    base = "questions"

    if storage_mode == "local":
        assert (
            backend.get_storage_path(base, relative=False)
            == (tmp_path / base).as_posix()
        )

    if storage_mode == "cloud":
        root = "test"
        assert (
            backend.get_storage_path(base, relative=False)
            == (Path(root) / base).as_posix()
        )


# =========================================================================
# Storage path operations
# =========================================================================


def test_create_storage_path(
    create_test_dir, active_storage_backend, tmp_path, storage_mode
):
    base = "questions"
    created, folder_name = create_test_dir

    if storage_mode == "local":
        target_path = Path(tmp_path / base / folder_name).as_posix()
        assert created == target_path
    if storage_mode == "cloud":
        root = "test"
        target_path = f"{root}/{base}/{folder_name}"
        assert created == target_path


def test_does_storage_path_exist(
    create_test_dir, active_storage_backend, tmp_path, storage_mode
):
    backend = active_storage_backend
    created, _ = create_test_dir
    assert backend.does_storage_path_exist(created)


def test_get_storage_path(create_test_dir, active_storage_backend):
    backend = active_storage_backend
    """Validate that get_storage_path returns the correct directory path."""
    created, folder_name = create_test_dir
    assert backend.get_storage_path(folder_name, False) == created


def test_ensure_storage_path_exist(active_storage_backend, create_test_dir):
    backend = active_storage_backend
    created, folder_name = create_test_dir
    assert backend.ensure_storage_path(folder_name) == created


def test_ensure_storage_path_nonexist(active_storage_backend, create_test_dir):
    backend = active_storage_backend
    folder_name = "MyNewQuestion"
    created = backend.ensure_storage_path(folder_name)
    print("This is the created", created)


def test_storage_path_exist(active_storage_backend, create_test_dir):
    backend = active_storage_backend
    created, folder_name = create_test_dir
    assert backend.does_storage_path_exist(created)


def test_rename_storage(active_storage_backend, create_test_dir):
    backend = active_storage_backend
    folder_name = "MyRename"
    created, folder = create_test_dir
    old_name = created
    new = backend.get_storage_path(folder_name, relative=False)

    renamed_storage = backend.rename_storage(old_name, new)

    # Assert that the old one does not exist
    assert backend.does_storage_path_exist(old_name) is False
    assert backend.does_storage_path_exist(renamed_storage) is True


# =========================================================================
# File operations: read, write, fetch
# =========================================================================


@pytest.mark.parametrize(
    "filename, content",
    [
        (
            "text.txt",
            "Hello World",
        ),  # string
        ("data.json", {"key": "value"}),  # dict
        ("binary.bin", b"\x00\x01\x02"),  # bytes
    ],
)
def test_save_file(
    active_storage_backend,
    create_test_dir,
    filename,
    content,
):
    """Ensure save_file correctly"""
    target, _ = create_test_dir
    f = active_storage_backend.save_file(target, content, filename, overwrite=True)
    f = Path(f)
    assert f.name == filename


@pytest.mark.parametrize(
    "filename, content",
    [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict → json
        ("binary.bin", b"\x00\x01\x02"),  # bytes → raw bytes
    ],
)
def test_read_file(active_storage_backend, create_test_dir, filename, content):
    target, _ = create_test_dir
    # --- Write file ---
    active_storage_backend.save_file(target, content, filename, overwrite=True)
    # --- Read file as raw bytes ---
    raw_bytes = active_storage_backend.read_file(target, filename)

    assert normalize_newlines(raw_bytes) == normalize_newlines(normalize(content))


# Same current functionality as read file
@pytest.mark.parametrize(
    "filename, content",
    [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict → json
        ("binary.bin", b"\x00\x01\x02"),  # bytes → raw bytes
    ],
)
def test_download_file(active_storage_backend, create_test_dir, filename, content):
    target, _ = create_test_dir
    # --- Write file ---
    active_storage_backend.save_file(target, content, filename, overwrite=True)
    # --- Read file as raw bytes ---
    raw_bytes = active_storage_backend.download_file(target, filename)
    assert normalize_newlines(raw_bytes) == normalize_newlines(normalize(content))


@pytest.mark.parametrize(
    "filename, content",
    [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict → json
        ("binary.bin", b"\x00\x01\x02"),  # bytes → raw bytes
    ],
)
def test_get_file_path(active_storage_backend, create_test_dir, filename, content):
    target, _ = create_test_dir
    active_storage_backend.save_file(target, content, filename)
    target_path = Path(target) / filename
    assert (
        active_storage_backend.get_file_path(target, filename) == target_path.as_posix()
    )


@pytest.mark.parametrize(
    "filename, file_content",
    [
        ("hello.txt", b"Hello World"),  # raw bytes
        ("data.bin", b"\x00\x01\x02\x03"),  # binary content
        ("from_io.txt", BytesIO(b"streamed data")),  # file-like object
    ],
)
def test_upload_file(active_storage_backend, create_test_dir, filename, file_content):
    target, _ = create_test_dir

    if isinstance(file_content, BytesIO):
        file_obj = file_content
        expected_bytes = file_content.getvalue()
    else:
        file_obj = BytesIO(file_content)
        expected_bytes = file_content

    # Upload the file
    upload = active_storage_backend.upload_file(
        file_obj=file_obj,
        target=target,
        filename=filename,
        content_type="application/octet-stream",
    )
    assert upload is not None
    assert active_storage_backend.read_file(target, filename) == expected_bytes


# =========================================================================
# File listing, checks, existence
# =========================================================================
def test_list_file_paths(active_storage_backend):
    data = [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict → json
        ("binary.bin", b"\x00\x01\x02"),  # bytes → raw bytes
    ]

    # Create a directory that will hold all files
    target = active_storage_backend.create_storage_path("MyFullDir")

    # Save all test files
    for filename, content in data:
        active_storage_backend.save_file(
            target=target, content=content, filename=filename
        )
    # Retrieve file paths
    retrieved_paths = active_storage_backend.list_file_paths(target)
    # Number of returned files should match what we saved
    assert len(retrieved_paths) == len(data)
    # Normalize expected filenames
    expected_filenames = sorted([name for name, _ in data])
    # Extract actual filenames (end of path)
    actual_filenames = sorted([Path(p).name for p in retrieved_paths])
    assert actual_filenames == expected_filenames


def test_list_file_names(active_storage_backend):
    data = [
        ("text.txt", "Hello World"),  # string
        ("data.json", {"key": "value"}),  # dict → json
        ("binary.bin", b"\x00\x01\x02"),  # bytes → raw bytes
    ]

    # Create a directory that will hold all files
    target = active_storage_backend.create_storage_path("MyFullDir")

    # Save all test files
    for filename, content in data:
        active_storage_backend.save_file(
            target=target, content=content, filename=filename
        )
    retrieved_paths = active_storage_backend.list_file_names(target)
    # Number of returned files should match what we saved
    assert len(retrieved_paths) == len(data)
    # Normalize expected filenames
    expected_filenames = sorted([name for name, _ in data])
    # Extract actual filenames (end of path)
    actual_filenames = sorted([Path(p).name for p in retrieved_paths])
    assert actual_filenames == expected_filenames


# =========================================================================
# Mutating operations: copy, move, delete
# =========================================================================


def test_delete_file(save_multiple_files, active_storage_backend):
    """Ensure delete_file removes files as expected."""
    dir = save_multiple_files
    files = active_storage_backend.list_file_paths(dir)
    print("This is the filepath", files)
    for f in files:
        active_storage_backend.delete_file(f)
        assert active_storage_backend.read_file(f) is None


def test_empty_directory(create_test_dir, active_storage_backend):
    """Check that a newly created directory is empty."""
    dir, _ = create_test_dir
    active_storage_backend.delete_storage(dir)
    f = active_storage_backend.list_file_paths(dir)
    assert f == []
