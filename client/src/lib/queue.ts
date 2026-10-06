import { OngoingDl } from "@/types/apiResponses";
import { AnimeSummary } from "./local-store";
import { invoke } from "@tauri-apps/api/core";

class Queue<T> extends EventTarget {
  protected elements: T[];
  isProcessing: boolean;
  constructor(initEls: T[] = []) {
    super();
    this.elements = initEls;
    this.isProcessing = false;
  }

  traverse() {
    return structuredClone<T[]>(this.elements);
  }

  pop() {
    const el = this.elements[0];
    this.elements = this.elements.slice(1);

    this.dispatchEvent(new Event("modify"));
    return el;
  }

  push(el: T) {
    this.elements.push(el);

    this.dispatchEvent(new Event("modify"));
  }

  clear() {
    this.elements = [];

    this.dispatchEvent(new Event("modify"));
  }

  removeAt(idx: number) {
    if (idx >=0 && this.elements[idx]) {
      this.elements = this.elements
        .slice(0, idx)
        .concat(this.elements.slice(idx + 1));
      this.dispatchEvent(new Event("modify"));
    }
  }
}

class OngoingDlQueue extends Queue<OngoingDl> {
  constructor() {
    super();
  }

  removeById(tId: string | number) {
    let i = this.elements.findIndex(({ id }) => id == tId);
    this.removeAt(i);
  }

  updateStatus(tid: string | number, val: OngoingDl["status"]) {
    let i = this.elements.findIndex(({ id }) => id == tid);
    if (i >= 0) this.elements[i] = { ...this.elements[i], status: val };

    this.dispatchEvent(new Event("status_update"));
  }

  updateProg(tid: string | number, val: Pick<OngoingDl, "curr" | "total">) {
    let i = this.elements.findIndex(({ id }) => id == tid);
    if (i >= 0) this.elements[i] = { ...this.elements[i], ...val };

    this.dispatchEvent(new Event("prog_update"));
  }

  async cancel(taskId: OngoingDl["id"], shouldInvoke: boolean) {
    const val = ongoingDownloadQueue.traverse().find(v => v.id == taskId)
    if (val) val.isCancelled = true

    if (shouldInvoke) {
      await invoke("cancel_dl", {id: taskId.toString()})
    }
  }
}

export const downloadQueue = new Queue<AnimeSummary & {queueId: string}>();
export const ongoingDownloadQueue = new OngoingDlQueue();

export default Queue;
