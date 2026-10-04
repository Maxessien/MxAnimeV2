from datetime import datetime
from typing import Any, TypedDict


class PikpakAuthException(Exception):
    message: str


class Credentials(TypedDict):
    username: str
    passsword: str
    remaining_use: int
    last_login: datetime


class PkCreds(TypedDict):
    creds: list[Credentials]
    curr_idx: int
    is_active: bool


class PikPakAudit(TypedDict):
    message: str
    status: str
    title: str


class PikPakDownloadLink(TypedDict):
    url: str
    token: str
    expire: str
    type: str
    fallbacks: list[Any]
    mirrors: list[Any]


# Uses Dict[str, ...] because the key "application/octet-stream" changes per file type
PikPakLinks = dict[str, PikPakDownloadLink]


class PikPakMediaLink(TypedDict):
    url: str
    token: str
    expire: str
    type: str
    fallbacks: list[Any]
    mirrors: list[Any]


class PikPakMedia(TypedDict):
    media_id: str
    media_name: str
    category: str
    resolution_name: str
    icon_link: str
    ext_icon: str
    is_default: bool
    is_origin: bool
    is_visible: bool
    need_more_quota: bool
    priority: int
    redirect_link: str
    vip_types: list[Any]
    link: PikPakMediaLink


class PikPakParams(TypedDict):
    original_share_id: str
    platform_icon: str
    url: str


class PikPakFileInfo(TypedDict):
    id: str
    parent_id: str
    user_id: str
    name: str
    size: str  # Kept as str because values are quoted string integers
    hash: str
    kind: str
    mime_type: str
    file_extension: str
    icon_link: str
    thumbnail_link: str
    folder_type: str
    phase: str
    starred: bool
    trashed: bool
    writable: bool
    revision: str
    created_time: str
    modified_time: str
    user_modified_time: str
    delete_time: str
    space: str
    apps: list[Any]
    tags: list[str]
    reference_events: list[Any]
    audit: PikPakAudit
    links: PikPakLinks
    medias: list[PikPakMedia]
    params: PikPakParams
    web_content_link: str
