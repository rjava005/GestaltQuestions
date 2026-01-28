from fastapi.routing import APIRouter
from src.web.dependencies import SettingDependency
import httpx
from src.core import logger
from pathlib import Path

router = APIRouter(prefix="/sandbox", tags=["sandbox"])


@router.post("/")
async def execute(app_settings: SettingDependency):
    sandbox_url = app_settings.SANDBOX_URL
    if not sandbox_url:
        raise ValueError("SANDBOX_URL must set Sandbox URL for execution")

    path = Path("app_test/test_assets/code/generate.py").resolve()

    try:
        async with httpx.AsyncClient() as client:
            generate_endpoint = f"{sandbox_url}/code_runner/generate"
            data = {
                "language": "python",
                "code": path.read_text(),
            }
            res = await client.post(generate_endpoint, json=data)
            logger.info("Got Sandbox response %s", res)
            try:
                data = res.json()
            except ValueError:
                data = res.text
            return {"data": f"{data}"}
    except Exception as e:
        raise ValueError(f"Could not make request {e}")
