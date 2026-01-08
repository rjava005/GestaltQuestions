from pydantic_settings import BaseSettings
from pathlib import Path


class TestConfig(BaseSettings):
    asset_path: Path


test_config = TestConfig(asset_path=Path("app_test/test_assets").resolve())
