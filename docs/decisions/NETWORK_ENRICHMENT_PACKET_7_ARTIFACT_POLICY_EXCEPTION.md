# Packet 7: Artifact Policy Exception Review

## Goal
Resolve whether the remaining untracked artifacts at packet boundary
(`agent_bridge/memory.db` and `clarity-platform-persistence-hardening/`) can remain out of this packet stream or must be converted into a reviewable artifact format.

## Context
- Packet 6 placed both paths in the boundary review stream and updated `.gitignore`.
- `clarity-platform-persistence-hardening/` is currently a linked worktree.
- `agent_bridge/memory.db` is a binary local bridge runtime database.

## Decision Questions

### 1) `clarity-platform-persistence-hardening/`
- **Option A (Approved):** Keep out of this stream as a separate worktree lane (`codex/om/persistence-hardening`) and continue runtime/service work on `clarity-platform`.
- **Option B (Revise):** Re-home into `clarity-platform` as a submodule link or other explicit repository link.
- **Option C (Defer):** Pause and decide this later.

### 2) `agent_bridge/memory.db`
- **Option A (Approved):** Keep out of source control as local runtime state; no commit unless explicitly replaced by a reviewed export.
- **Option B (Revise):** Continue excluding binary and add a curated, reviewable text export artifact for decision evidence.
- **Option C (Defer):** Pause and decide this later.

## Packet 7 Decision
- `clarity-platform-persistence-hardening/` → **Option A (Approved)**  
  Kept as a separate linked worktree lane to avoid cross-repo merge risk and preserve existing PR boundaries.
- `agent_bridge/memory.db` → **Option A (Approved)**  
  Excluded from source control; binary state remains local. If reviewability is required, capture it through a non-binary export artifact in a follow-up packet, not this one.

## Execution Consequences
- Runtime/service packets remain clean and reviewable in this branch.
- Future Packet ownership remains explicit:
  - Re-home request, if ever needed, must be handled as a Packet-level repository architecture change.
  - Memory review export, if ever needed, must be handled as a Packet-level evidence artifact with a clear schema.

## Acceptance
- `git status` must show no pending worktree or `memory.db` capture in the stream.
- This branch may proceed with runtime/service work under the current Packet 5C boundaries.
