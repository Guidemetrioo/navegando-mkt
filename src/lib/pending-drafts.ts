import { diffWorkspace } from './workspace';
import type { CloudSnapshot, Workspace, Change } from './workspace';
export interface DraftStorage { length: number; key(index: number): string | null; getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void; }
export function readPendingDrafts(storage: DraftStorage, userId: string, except?: string): {key:string;raw:string}[] {
  const prefix = `navegando-pending:${userId}`;
  const drafts: {key:string;raw:string}[] = [];
  for (let i=0; i<storage.length; i++) {
    const key=storage.key(i);
    if (key && key!==except && (key===prefix || key.startsWith(`${prefix}:`))) {
      const raw=storage.getItem(key); if(raw) drafts.push({key,raw});
    }
  }
  return drafts;
}
export function archivePendingDrafts(storage: DraftStorage, drafts: {key:string;raw:string}[]): void {
  // Never delete a draft unless its archival copy was written successfully.
  for (const draft of drafts) {
    storage.setItem(draft.key.replace('navegando-pending:', 'navegando-archived:'),draft.raw);
    storage.removeItem(draft.key);
  }
}

export function makePendingDraft(base:CloudSnapshot, latest:Workspace, batch:{requestId:string;changes:Change[]}|null) {
  return {version:2,userId:base.member.user_id,changes:diffWorkspace(base,latest),request:batch ? {requestId:batch.requestId,changes:batch.changes} : null,exportedAt:new Date().toISOString()};
}
