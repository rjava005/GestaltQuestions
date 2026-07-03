import io
from pathlib import Path
from typing import List, TypeVar

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from pydantic import BaseModel, ConfigDict
from utils import to_serializable


class GDriveFile(BaseModel):
    id: str
    name: str
    mimeType: str
    parents: List[str] = []

    model_config = ConfigDict(extra="ignore")


T = TypeVar("T", bound=BaseModel)


class GoogleDriveIndexer:
    _SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
    _FOLDERMIME = "application/vnd.google-apps.folder"

    def __init__(
        self,
        credentials_path: str | Path,
        token_path: str | Path | None = None,
        file_model: type[T] = GDriveFile,
    ):
        """Initialize the indexer with OAuth credentials and an optional token cache."""
        self.credentials_path = Path(credentials_path)
        if not self.credentials_path.exists():
            raise ValueError(
                f"Failed to initialize: Credentials {credentials_path} does not exist/resolve"
            )
        self.token_path = (
            Path(token_path)
            if token_path
            else self.credentials_path.parent / "token.json"
        )
        self.file_model = file_model
        self.service = self.get_service()

    def get_service(self):
        """Return an authenticated Google Drive API service, refreshing or creating a token as needed."""
        creds = None

        # Check credentials and load
        if self.token_path.exists():
            creds = Credentials.from_authorized_user_file(self.token_path, self._SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path,
                    self._SCOPES,
                )
                creds = flow.run_local_server(port=0)
            self.token_path.write_text(creds.to_json())
        return build("drive", "v3", credentials=creds)

    def get_file(self, name: str) -> List[GDriveFile]:
        """Return non-trashed Drive files matching the given name."""
        query = f"name='{name}' and trashed = false"
        response = (
            self.service.files()
            .list(
                q=query,
                fields=self._construct_fields(),
            )
            .execute()
        )
        files = response.get("files", [])
        return files

    def list_children(
        self,
        folder_id: str | None = "root",
        name: str | None = None,
        recursive: bool = False,
    ) -> List[GDriveFile]:
        """Return non-trashed children for a Drive folder ID or unique folder name."""
        if name:
            folder_id = self._get_folder_id_by_name(name)
        elif folder_id is None:
            raise ValueError("Expected either folder_id or name")

        query = f"'{folder_id}' in parents and trashed = false"

        results = (
            self.service.files()
            .list(
                q=query,
                fields=self._construct_fields(),
                pageSize=1000,
            )
            .execute()
        )
        files = results.get("files", [])
        if not recursive:
            return files

        results = []

        for raw_file in files:
            file = self.file_model.model_validate(raw_file)
            results.append(file)

            if file.mimeType == self._FOLDERMIME:
                results.extend(self.list_children(folder_id=file.id, recursive=True))

        return results

    def read_file(self, id: str) -> bytes:
        request = self.service.files().get_media(fileId=id)
        file = io.BytesIO()
        downloader = MediaIoBaseDownload(file, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        return file.getvalue()

    def _get_folder_id_by_name(self, name: str) -> str:
        """Return the Drive folder ID for a unique, non-trashed folder name."""
        files = self.get_file(name)
        if not files:
            raise ValueError(f"Folder not found: {name}")
        if len(files) > 1:
            raise ValueError(f"Expected one entry named {name!r}, got {len(files)}")

        folder = self.file_model.model_validate(files[0])
        if folder.mimeType != self._FOLDERMIME:
            raise ValueError(f"Expected {name!r} to be a folder")
        return folder.id

    def _construct_fields(self) -> str:
        """Build the Drive API fields selector from the configured file model."""
        fields = ",".join(self.file_model.model_fields.keys())
        return f"files({fields})"


if __name__ == "__main__":
    import json

    root = Path(__file__).parents[2]
    cred_path = root / "credentials.json"
    token_path = root / "token.json"

    indexer = GoogleDriveIndexer(cred_path, token_path)
    # BASE ID points to the statics folder
    statics_folder = "1XJp7G0n7SQFtV8CDggO82V4V_09LpIiC"
    results = indexer.list_children(
        folder_id="1XJp7G0n7SQFtV8CDggO82V4V_09LpIiC", recursive=True
    )
    (root / "data.json").write_text(json.dumps(to_serializable(results)))
