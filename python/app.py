import asyncio
from os import environ
from typing import Union

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from models.types import PikPakFileInfo
from pikpakapi import PikPakApi, PikpakException
from utils.util import PIKPAK_CREDENTIALS, parse_pikpak_info, pikpak_auth

load_dotenv()

pikpak: PikPakApi

app = Flask(__name__)

async def assign():
    global pikpak
    pikpak = await pikpak_auth()

asyncio.run(assign())


@app.route("/task", methods=["POST"])
async def add_task():
    try:
        if (
            PIKPAK_CREDENTIALS["creds"][PIKPAK_CREDENTIALS["curr_idx"]]["remaining_use"]
            == 0
        ):
            PIKPAK_CREDENTIALS["curr_idx"] += 1
            await pikpak_auth()
        magUri = dict(request.get_json()).get("magUri")
        if not magUri:
            return jsonify("Magnet uri is missing"), 4
        r = await pikpak.offline_download(file_url=magUri)

        PIKPAK_CREDENTIALS["creds"][PIKPAK_CREDENTIALS["curr_idx"]][
            "remaining_use"
        ] -= 1

        return jsonify(r.get("task")), 201
    except PikpakException as err:
        return jsonify(err), 500


@app.route("/status", methods=["GET"])
async def get_status():
    try:
        (file_id, task_id) = (request.args.get("file_id"), request.args.get("task_id"))

        if not task_id:
            return jsonify("id missing"), 500

        off_list = dict(
            await pikpak.offline_list(
                phase=[
                    "PHASE_TYPE_RUNNING",
                    "PHASE_TYPE_ERROR",
                    "PHASE_TYPE_COMPLETE",
                    "PHASE_TYPE_PENDING",
                ]
            )
        )

        itm: Union[PikPakFileInfo, None] = None
        info = None

        tasks: list[PikPakFileInfo] = off_list.get("tasks")

        if tasks:
            for tsk in tasks:
                if tsk["id"] == task_id:
                    itm = tsk

        if not itm:
            return jsonify("Download not found"), 404
        elif itm.get("phase") == "PHASE_TYPE_ERROR":
            return jsonify("Download failed"), 500
        elif itm.get("phase") == "PHASE_TYPE_COMPLETE":
            info = await pikpak.get_download_url(itm.get("file_id"))

        return jsonify(
            {
                "status": "done"
                if itm.get("phase") == "PHASE_TYPE_COMPLETE"
                else "downloading",
                "info": parse_pikpak_info(info) if info else None,
            }
        )
    except PikpakException as err:
        return jsonify(err), 500


if __name__ == "__main__":
    app.run(
        "0.0.0.0",
        int(environ.get("PORT") or "5000"),
        int(environ.get("PORT") or 5000) > 0,
    )
