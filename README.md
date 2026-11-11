# Memory & Encoding Study

A static browser-based psychology experiment built with plain HTML, CSS, and JavaScript.

## Files
- `index.html` — page structure
- `styles.css` — appearance
- `script.js` — experiment logic, randomization, scoring, and CSV exports

## Run locally
1. Keep all three files in the same folder.
2. Double-click `index.html` or open it in a browser.
3. Complete the experiment. Each of the 18 words is shown for 4 seconds.
4. The backward-counting distractor lasts 30 seconds.
5. At the results screen, download both CSV files.

No server, database, framework, package installation, or build step is required.

## Publish with GitHub Pages
1. Create a new GitHub repository (for example, `memory-encoding-study`).
2. Upload `index.html`, `styles.css`, and `script.js` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`, then save.
6. Wait for GitHub Pages to publish and open the public URL shown on the Pages settings screen.

## Data and scoring notes
- Randomizes the order of the three encoding strategies and assigns a shuffled word list to each strategy for each session.
- The summary CSV contains one row per completed session.
- The trial-level CSV contains 18 rows per completed session.
- Recall matching ignores capitalization and punctuation. It also accepts a one-character spelling difference for words of at least five letters. This is an approximate automated rule, not human semantic adjudication.
- Data are generated locally in the participant's browser and are not transmitted to a server. The participant must download the CSV files before leaving the results page.

## Important testing note
Run several sessions to check that block order and word-list assignments vary. Browser timing can vary slightly depending on the device and whether the tab remains active.
