# Changelog

## 0.1.19 — Improve XLSX XML extraction

- Improved the XLSX fallback parser to read workbook sheet relationships, shared strings, inline strings, booleans, and cell coordinate gaps.
- Restarted the local runtime with XML/SimpleXML extensions available for workbook XML parsing.

## 0.1.18 — Allow empty extracted file content

- Relaxed chat message validation so uploaded files with empty extracted content do not block the AI request.
- Added a fallback note for files that upload successfully but produce no extractable text.

## 0.1.17 — Prefer XLSX fallback parser

- Changed `.xlsx` parsing to try the unzip/XML fallback before PhpSpreadsheet so runtimes without ZipArchive can still parse basic Excel files.
- Restarted the local Devora Studio PHP runtime on port 8333 with zip/gd/pdo_mysql extensions installed in the container.

## 0.1.16 — Fix mobile file modal layout

- Improved the file intelligence modal on mobile with bottom-sheet positioning and safer viewport height.
- Made the modal body scroll independently while keeping header/footer visible.
- Stacked footer actions and scan card content on narrow screens.
- Reduced text sizing and spacing on mobile to prevent overflow.

## 0.1.15 — Clarify file prompt flow and XLSX fallback

- Added modal guidance explaining that users upload files first, then type their prompt in the chat box after the file card appears.
- Added an XLSX unzip fallback parser for runtimes without PHP ZipArchive.
- Keeps PhpSpreadsheet as the primary parser when ZipArchive is available.

## 0.1.14 — Highlight file scan result card

- Removed the upload count from the file modal upload button.
- Added a distinct Scan result section so detected file analysis is visually separated from general guidance.
- Increased contrast for file grade cards and grade badges.

## 0.1.13 — File intelligence upload guide

- Added a pre-upload file intelligence modal when users click the file button.
- Shows supported/less-ideal file guidance before upload.
- Grades selected files with a score and status such as Excellent, Good, Usable, Risky, or Unsupported.
- Blocks unsupported files before upload and warns when only the first 2 valid files will be attached.

## 0.1.12 — Backend document parsing pipeline

- Added `/chat/files` backend upload endpoint for file-capable models.
- Added Laravel parser service for PDF, Excel, CSV/TSV, and text/code files.
- PDF text extraction uses `smalot/pdfparser`; scanned PDFs return a clear OCR warning.
- Excel parsing uses PhpSpreadsheet with sheet and row limits for safer model context.
- CSV parsing uses League CSV with delimiter detection.
- Removed browser-side XLSX dependency and moved parsing responsibility to backend.

## 0.1.11 — Add Excel spreadsheet attachment support

- Added browser-side spreadsheet parsing for `.xlsx`, `.xlsm`, and `.xls` attachments via SheetJS.
- Converts up to 5 sheets and 80 rows per sheet into CSV-like text before sending to the model.
- Keeps the existing max 2 file attachment limit for file-capable models.

## 0.1.10 — Enable file attachments for file-capable models

- Added a file attachment button that appears only when the selected model has file support enabled.
- Limited file attachments to a maximum of 2 files per message.
- Sends attached text/code file content into the model request with clear File 1/File 2 labels.
- Added file attachment cards in the composer and user message bubbles.

## 0.1.9 — Refresh file capability icon

- Changed the file capability icon from a portrait document to a landscape card shape.
- Matched the icon proportions with the image capability icon for a more cohesive picker style.

## 0.1.8 — Mark unavailable models in picker

- Changed inactive model dropdown rows to show `Unavailable` instead of `inactive`.
- Disabled unavailable rows and added a lock icon on the right side.
- Hid capability chips for unavailable models to make the disabled state clearer.

## 0.1.7 — Fix MiniMax icon source

- Replaced MiniMax SVG icon with proper color PNG from LobeHub.

## 0.1.6 — Add MiniMax provider category

- Added MiniMax as a new model provider category with icon from Simple Icons.
- Category icon mapped to minimax.svg.

## 0.1.5 — Fix sidebar footer responsive layout

- Made the sidebar footer stick to the bottom consistently on desktop and mobile.
- Added proper scroll containment so the footer never gets pushed off-screen.
- Improved padding and spacing for the version label on narrow sidebars.

## 0.1.4 — Add Xiaomi / Mimo provider category

- Added Xiaomi / Mimo as a new model provider category.
- Added the Xiaomi brand icon SVG to the provider assets.

## 0.1.3 — Chat nav brand typography

- Updated the chat nav brand title to a compact mono uppercase style inspired by the Strait Hormuz waitlist nav.
- Applied wider letter spacing for a sharper brand mark feel.

## 0.1.2 — Welcome logo refresh

- Updated the empty-chat welcome logo with the new Devora brand image.
- Kept the welcome card layout compact and centered for desktop and mobile.

## 0.1.1 — Sidebar version label polish

- Changed the sidebar footer from a prominent Version control card to a small italic version label.
- Kept the changelog button available without making the sidebar feel noisy.

## 0.1.0 — Version control baseline

- Added Devora Studio in-app version badge in the chat sidebar.
- Added a changelog button/modal so users can see what changed in the current release.
- Added project rule: every feature/UI/security update must bump `package.json` version and update this changelog.
- Set initial tracked app version to `0.1.0`.
