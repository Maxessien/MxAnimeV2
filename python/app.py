from flask import Flask, request, jsonify
from pikpakapi import PikPakApi, DownloadStatus, PikpakException
from os import environ
from dotenv import load_dotenv
from models.types import PikPakFileInfo
from typing import Union
import asyncio
from utils.util import parse_pikpak_info

load_dotenv()


app = Flask(__name__)

pikpak = PikPakApi(
    username=environ.get("PIKPAK_USERNAME"), password=environ.get("PIKPAK_PASSWORD")
)

asyncio.run(pikpak.login())


@app.route("/task", methods=["POST"])
async def add_task():
    try:
        magUri = dict(request.get_json()).get("magUri")
        r = await pikpak.offline_download(file_url=magUri)

        return jsonify(r.get("task")), 201
    except PikpakException as err:
        return jsonify(err), 500


@app.route("/status", methods=["GET"])
async def get_status():
    try:
        (file_id, task_id) = (request.args.get("file_id"), request.args.get("task_id"))

        if not task_id:
            return jsonify("id missing"), 500

        # if file_id:
        #     st = await pikpak.get_task_status(task_id, file_id)

        #     info: Union[PikPakFileInfo, None] = None

        #     if st == DownloadStatus.done:
        #         info = await pikpak.get_download_url(file_id)
        #     elif st == DownloadStatus.error:
        #         return jsonify("Download failed"), 500
        #     elif st == DownloadStatus.not_found:
        #         return jsonify("Download not found"), 404

        off_list = dict(await pikpak.offline_list(
            phase=[
                "PHASE_TYPE_RUNNING",
                "PHASE_TYPE_ERROR",
                "PHASE_TYPE_COMPLETE",
                "PHASE_TYPE_PENDING",
            ]
        ))

        itm: Union[PikPakFileInfo, None] = None
        info = None

        tasks: list[PikPakFileInfo] = off_list.get("tasks")

        if tasks:
            for tsk in tasks:
                if tsk["id"] == task_id: itm = tsk

        if not itm: return jsonify("Download not found"), 404
        elif itm.get("phase") == "PHASE_TYPE_ERROR": return jsonify("Download failed"), 500
        elif itm.get("phase") == "PHASE_TYPE_COMPLETE": info = await pikpak.get_download_url(itm.get("file_id"))

        return jsonify(
            {
                "status": "done" if itm.get("phase") == "PHASE_TYPE_COMPLETE" else "downloading",
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
