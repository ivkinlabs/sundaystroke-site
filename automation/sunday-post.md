# The Sunday post: weekly run

You are the unattended weekly run that publishes the Sunday post on sundaystroke.com. No person started you and no person is watching. Never ask anyone anything, and never stop to wait for an answer.

Your working directory is a fresh worktree of `ivkinlabs/sundaystroke-site` on `origin/main`. `FACTORY` below is `/Users/ivkin/my/factory-runtime`.

## Start

1. `npm ci`
2. `node src/sunday/cli.ts plan` prints JSON: `issueDate` (call it `D`), `steps` (what is due now, in order) and `paths` (the state files for `D`).
3. If `steps` is empty, you are done: stop without any message.
4. Do each step below in the order `steps` lists them. If a step fails, stop there: don't message anyone and don't work around the failure. The next run (twice a day) tries again, and a Sunday with no issue alerts the owner once on Monday.

## find

`node src/sunday/cli.ts find --date D` collects the week's stories from the fixed list of feeds in `src/sunday/sources.ts` into `paths.candidates`: title, link, date and a short excerpt only.

## write

1. `git switch -c sunday/D`
2. Read `paths.candidates`. Golf stories come from the golf feeds; disc golf stories come from the PDGA and DGPT feeds and go only in the Tracer section.
3. Choose 3 to 5 stories a club golfer would care about this week (results, rule or tour news, a practical playing idea). A thin week gets fewer stories, down to one; never pad it. Skip live blogs, betting, gear deals and listicles.
4. Open each chosen story's page and read it before you write about it. Write every item in your own words from what the page says: a short headline and at most two sentences. Never copy a sentence, never quote more than a few words, never use the source's photos. Every name, number and date must be on that page.
5. The lead says something only we have: one of the site's own traced clips (pick one or two pairs of `.mp4` and `.jpg` under `public/media/`, not the clip the previous issue used if another fits) with one or two sentences that tie it to the week. Never claim the clip is a golfer's own video and never show anyone's footage that is not already on the site.
6. Write `src/data/sunday/D.json` in exactly the shape of the previous issue's file: `slug` = `D`, the next `number`, `date` = "Sunday <d> <Month> <yyyy>", `title` = "The Sunday post, issue <n>", a `pageTitle` naming the week's two or three main stories and ending in " | SundayStroke", a one-line `summary`, `leadText`, `leadClips`, then a `golf` section headed "Golf" and a `tracer` section headed "For Tracer: disc golf" (leave out a section with no story). `sourceLabel` is the feed's name as `paths.candidates` gives it, `sourceUrl` the story's `link`, unchanged.
7. Never change any other file. Earlier issues, their dates and their wording stay exactly as published.
8. Copy rules for everything you write: plain words for golfers; no prices; never the word "shot" followed by "tracer"; nothing about baseball; never say Tracer measures, calculates or tracks distance; never name tools, vendors, the tech stack or how this run works; disc golf only in the Tracer section.
9. `node src/sunday/cli.ts validate --date D`, then `npm run build`. Fix what they report and run both again until they pass.
10. `git add src/data/sunday/D.json && git commit -m "The Sunday post, issue <n>"`

## check

A second, independent agent checks every item against its source. You must not check your own work.

1. Run the checker and wait for it:
   `{ cat automation/sunday-check.md; printf '\nIssue date: %s\nIssue file: %s\nCandidates: %s\nWrite verdicts to: %s\n' D src/data/sunday/D.json <paths.candidates> <paths.verdicts>; } | claude -p --model claude-opus-5-5 --permission-mode bypassPermissions --output-format text`
2. `node src/sunday/cli.ts apply-check --date D` removes every item the checker rejected or whose link doesn't open, and checks the rules again. If it says nothing was confirmed, stop: there is no issue this week.
3. Don't edit the items after the check. `npm run build`, then `git commit -am "Keep only the items the source check confirmed"` (skip the commit when nothing changed).

## open-pr

`git push -u origin sunday/D`, then `gh pr create --repo ivkinlabs/sundaystroke-site --base main --head sunday/D --title "The Sunday post, issue <n> (D)" --body <body>`. The body lists each kept item with its source link and the checker's reason, then each rejected item with its reason.

## publish

`node src/sunday/cli.ts publish --date D --factory FACTORY` merges the pull request, waits for the site deploy, confirms `https://sundaystroke.com/sunday/D/` answers 200 and is in the sitemap, and puts one line in the owner's daily digest.

## alert-missed

`node src/sunday/cli.ts alert-missed --date D --factory FACTORY` tells the owner once that Sunday `D` has no issue.

## report

The pilot has had its four issues, so the owner needs numbers to keep or stop it.

1. Read, in the owner's logged-in Chrome (how: `/Users/ivkin/.claude/projects/-Users-ivkin-my-GolfGPS/memory/reference-owner-browser-automation.md`), the visits to each `/sunday/<date>/` page from the site's cookie-free page analytics, and the App Store first-time downloads for campaign `web-sunday` (both apps) from App Store Connect, Analytics, Acquisition, Campaigns.
2. Draw one portrait image, 1080 px wide: visits per issue as bars, and the store downloads from `web-sunday`, labelled in plain words. A self-contained HTML page with inline SVG, shot with `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-features=MacAppCodeSignClone --hide-scrollbars --window-size=1080,1350 --screenshot=<abs png> file://<abs html>`. Open the PNG and look at it.
3. `uv run --frozen --project FACTORY factory notify golfgps "<b>The Sunday post pilot: 4 issues, <visits> visits, <downloads> store downloads.</b> <one line on what the numbers say>" --image <png> --digest`. If a number can't be read, say which one is missing instead of guessing.
4. `node src/sunday/cli.ts mark-reported`
