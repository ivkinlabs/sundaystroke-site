# The Sunday post: weekly run

You are the unattended weekly run that publishes the Sunday post on sundaystroke.com. No person started you and no person is watching. Never ask anyone anything, and never stop to wait for an answer.

Your working directory is a fresh worktree of the site on `origin/main`. Every step except writing is done by `node src/sunday/cli.ts <command> --date D`: run those commands exactly, never do their work by hand (no `git commit`, `git push`, `gh pr create` or `gh pr merge` of your own), and never edit the state files they keep.

## Start

1. `node src/sunday/cli.ts plan` prints JSON: `issueDate` (call it `D`), `steps` (what is due now, in order) and `paths`.
2. If `steps` is empty, you are done: stop without any message.
3. `npm ci`
4. Do each step below in the order `steps` lists them. If a step fails, stop there: don't message anyone and don't work around the failure. The next run tries again, and a Sunday with no issue alerts the owner once on Monday.

## find

`node src/sunday/cli.ts find --date D` collects the week's stories from the fixed list of feeds into `paths.candidates`: title, link, date and a short excerpt only.

## write

1. Read `paths.candidates`. Golf stories come from the golf feeds; disc golf stories come from the PDGA and DGPT feeds and go only in the Tracer section.
2. Choose 3 to 5 stories a club golfer would care about this week (results, rule or tour news, a practical playing idea). A thin week gets fewer stories, down to one; never pad it. Skip live blogs, betting, gear deals and listicles.
3. Open each chosen story's page and read it before you write about it. Write every item in your own words from what the page says: a short headline and at most two sentences. Never copy a sentence, never quote more than a few words, never use the source's photos. Every name, number and date must be on that page.
4. The lead says something only we have: one or two of the site's own traced clips (a pair of `.mp4` and `.jpg` under `public/media/`; not the previous issue's clip if another fits) with one or two sentences that tie it to the week. Never claim the clip is someone's own round, and never show footage that isn't already on the site.
5. Write `src/data/sunday/D.json` in exactly the shape of the previous issue's file: `slug` = `D`, the next `number`, `date` = "Sunday <d> <Month> <yyyy>", `title` = "The Sunday post, issue <n>", a `pageTitle` naming the week's two or three main stories and ending in " | SundayStroke", a one-line `summary`, `leadText`, `leadClips`, then a `golf` section headed "Golf" and a `tracer` section headed "For Tracer: disc golf" (leave out a section with no story). `sourceLabel` is the feed's name as `paths.candidates` gives it; `sourceUrl` is the story's `link`, unchanged.
6. Never change any other file. Earlier issues, their dates and their wording stay exactly as published.
7. Copy rules for everything you write: plain words for golfers; no prices; never the word "shot" followed by "tracer"; nothing about baseball; never say Tracer measures, calculates or tracks distance; never name tools, vendors, the tech stack or how this run works; disc golf only in the Tracer section.
8. `node src/sunday/cli.ts validate --date D`, then `npm run build`. Fix what they report and run both again until they pass.

## check

`node src/sunday/cli.ts check --date D` hands the issue to a second, independent checker that reads every source page and confirms or rejects each item, drops the rejected items and any dead link, and records what it checked. Don't touch the issue file after it; if it says nothing was confirmed, stop: there is no issue this week. Then `npm run build`.

## open-pr

`node src/sunday/cli.ts open-pr --date D` restores the checked issue (so a later run can open the pull request without writing it again), builds the site, commits the issue on its own branch and opens the pull request, listing each kept and rejected item with the checker's reason.

## publish

`node src/sunday/cli.ts publish --date D` re-checks the pull request (only the issue file, unchanged since the check, still following the rules), merges it, waits for the site to update, confirms `https://sundaystroke.com/sunday/D/` is up and in the sitemap, and puts one line in the owner's daily digest.

## alert-missed

`node src/sunday/cli.ts alert-missed --date D` tells the owner once that Sunday `D` had no issue.

## report

The pilot has had its four issues, so the owner needs numbers to keep or stop it.

1. Read, in the owner's logged-in Chrome (how: `/Users/ivkin/.claude/projects/-Users-ivkin-my-GolfGPS/memory/reference-owner-browser-automation.md`), the visits to each `/sunday/<date>/` page from the site's cookie-free page analytics, and the App Store first-time downloads for campaign `web-sunday` (both apps) from App Store Connect, Analytics, Acquisition, Campaigns.
2. Draw one portrait image, 1080 px wide: visits per issue as bars, and the store downloads from `web-sunday`, labelled in plain words. Make it a self-contained HTML page with inline SVG, and shoot it with `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-features=MacAppCodeSignClone --hide-scrollbars --window-size=1080,1350 --screenshot=<abs png> file://<abs html>`. Open the PNG and look at it.
3. `uv run --frozen --project <factoryRuntime from plan> factory notify golfgps "<b>The Sunday post pilot: 4 issues, <visits> visits, <downloads> store downloads.</b> <one line on what the numbers say>" --image <png> --digest`. If a number can't be read, say which one is missing instead of guessing.
4. `node src/sunday/cli.ts mark-reported`
