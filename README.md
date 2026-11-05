# MEC 2026 Preparation Hub (web page)

This branch (`gh-pages`) holds only the static web page of the MEC 2026
Preparation Hub, published with GitHub Pages at
https://silimanengoma.github.io/who-afro-performance-intelligence/mec2026/

It is separate from the SAM1 platform code on `main`.

## Updating, from a browser

1. On GitHub, switch to the `gh-pages` branch.
2. Statuses: open `mec2026/data/tracker.csv`, click the pencil, edit, commit.
   Or edit it in Excel, save as CSV UTF-8, and use Add file > Upload files
   into `mec2026/data/` with the same name.
3. Decisions: same with `mec2026/data/decisions.csv`.
4. New files: Add file > Upload files into `mec2026/docs/`, then put the exact
   file name in the `files` column of tracker.csv (several names separated by `|`).

GitHub Pages republishes within a minute or two. The link does not change.

Status values. Documents: Not started, Drafting, In review, Final.
Data requests: Requested, Partly received, Received, Issue.
Dates: 2026-11-17 or 17/11/2026.

Note: this page is public. Anyone with the link can read it.

## Plan RH 2028-2029 (OMS RDC)

`planrh2028/index.html` is a standalone tool, published at
https://silimanengoma.github.io/who-afro-performance-intelligence/planrh2028/

It holds no data. Team Leads load the XLSX template sent by the PMO through
internal email, record their position proposals for 2028-2029, and export a
return file. The PMO consolidates the files, the WR validates or rejects each
proposal, and the retained positions export to XLSX for SPM costing.
Everything stays in the user's browser and files; nothing is sent to a server.
Do not commit the workforce plan or any return file to this repository.
