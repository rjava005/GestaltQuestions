from pathlib import Path
import pytest


@pytest.fixture
def create_dir_factory(storage, tmp_path):
    def _create(storage_mode: str, target: str) -> str:
        if storage_mode == "local":
            target_path = Path(tmp_path / target).as_posix()
            storage.create_dir(target_path)

        elif storage_mode == "cloud":
            target_path = target
            storage.create_dir(target_path)

        else:
            raise ValueError(f"Unknown storage_mode: {storage_mode}")

        return target_path

    return _create
