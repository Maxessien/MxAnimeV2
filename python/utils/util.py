from datetime import datetime, timezone
from json import JSONDecodeError, loads
from os import environ

from dotenv import load_dotenv
from models.types import PikpakAuthException, PkCreds
from pikpakapi import PikPakApi

load_dotenv()

PIKPAK_CREDENTIALS: PkCreds = {"curr_idx": 0, "creds": [], "is_active": False}


def parse_pikpak_info(info):
    urls = [link for link in info.get("links").values()]

    return urls


def parseEnvIntoCreds():
    usernames = environ.get("PIKPAK_USERNAME")
    passwords = environ.get("PIKPAK_PASSWORD")

    if not usernames or not passwords:
        return {"success": False}

    try:
        parsed_username = loads(usernames)
    except JSONDecodeError:
        parsed_username = usernames
    try:
        parsed_password = loads(passwords)
    except JSONDecodeError:
        parsed_password = passwords

    if isinstance(parsed_username, str) or isinstance(parsed_password, str):
        PIKPAK_CREDENTIALS["creds"].append(
            {
                "username": parsed_username,
                "passsword": parsed_password,
                "remaining_use": 3,
                "last_login": datetime.now(timezone.utc),
            }
        )
        PIKPAK_CREDENTIALS["is_active"] = True
        return {"success": True}

    elif isinstance(parsed_username, list) and isinstance(parsed_password, list):
        for i, name in enumerate(parsed_username):
            if parsed_password[i]:
                PIKPAK_CREDENTIALS["creds"].append(
                    {
                        "username": name,
                        "passsword": parsed_password[i],
                        "remaining_use": 3,
                        "last_login": datetime.now(timezone.utc),
                    }
                )
        if len(PIKPAK_CREDENTIALS["creds"]) > 0:
            PIKPAK_CREDENTIALS["is_active"] = True
            return {"success": True}

    return {"success": False}


async def get_remaining_free_tasks(client: PikPakApi):
    try:
        offline_response = await client.offline_list(
            phase=[
                "PHASE_TYPE_RUNNING",
                "PHASE_TYPE_ERROR",
                "PHASE_TYPE_COMPLETE",
                "PHASE_TYPE_PENDING",
            ]
        )
        tasks = offline_response.get("tasks", [])
    except Exception:
        # Fallback if the network or token fails temporarily
        return 0

    # 3. Calculate today's UTC midnight timestamp
    now_utc = datetime.now(timezone.utc)
    today_midnight_utc = datetime(
        now_utc.year, now_utc.month, now_utc.day, tzinfo=timezone.utc
    )

    # 4. Count how many tasks were created today
    tasks_created_today = 0
    for task in tasks:
        # PikPak API timestamps are strings or millisecond integers (e.g., "1715112345" or milliseconds)
        # Check your print payload for the exact key structure, usually 'gmt_create' or 'create_time'
        create_time_raw = task.get("created_time")

        if create_time_raw:
            task_date = datetime.fromisoformat(create_time_raw)

            # If the task was started after midnight UTC today, count it
            if task_date >= today_midnight_utc:
                tasks_created_today += 1

    # 5. Subtract today's usage from the strict limit of 3
    remaining_tasks = max(0, 3 - tasks_created_today)
    return remaining_tasks


async def pikpak_auth():
    if not PIKPAK_CREDENTIALS["is_active"]:
        parseEnvIntoCreds()
    if len(PIKPAK_CREDENTIALS["creds"]) == 0 or PIKPAK_CREDENTIALS["curr_idx"] >= len(
        PIKPAK_CREDENTIALS["creds"]
    ):
        raise PikpakAuthException

    idx = PIKPAK_CREDENTIALS["curr_idx"]

    curr_info = PIKPAK_CREDENTIALS["creds"][idx]

    pikpak = PikPakApi(username=curr_info["username"], password=curr_info["passsword"])

    await pikpak.login()

    remaining = await get_remaining_free_tasks(pikpak)

    if remaining == 0:
        PIKPAK_CREDENTIALS["curr_idx"] += 1
        return await pikpak_auth()
    else:
        return pikpak
