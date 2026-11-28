# The Sunday post: weekly run

You are the unattended weekly run that writes the Sunday post for sundaystroke.com and opens it as a pull request; the factory publishes it once the owner approves its exact text. No person started you and no person is watching. Never ask anyone anything, and never stop to wait for an answer.

Your working directory is a fresh worktree of the site on `origin/main`. Every step except writing is done by `node sunday/cli.ts <command> --date D`: run those commands exactly, never do their work by hand (no `git commit`, `git push`, `gh pr create` or `gh pr merge` of your own), and never edit the state files they keep.

## Start

1. `node sunday/cli.ts plan` prints JSON: `issueDate` (call it `D`), `steps` (what is due now, in order) and `paths`.
2. If `steps` is empty, you are done: stop without any message.
3. `npm ci`
4. Do each step below in the order `steps` lists them. If a step fails, stop there: don't message anyone and don't work around the failure. After your run the factory runs `sunday/done.sh`, which fails while a step is still due and alerts the owner.

## find

`node sunday/cli.ts find --date D` collects the week's stories from the fixed list of feeds into `paths.candidates`: title, link, date and a short excerpt only.

## write

The model is a golf newsletter people read for its own sake: a 3 to 5 minute read with a clear voice, enough to talk about golf this week, and a link to every full story.

1. Read `paths.candidates`. Golf stories come from the golf feeds; disc golf stories come from the PDGA and DGPT feeds and go only in the Disc golf section.
2. Choose 3 to 5 stories a club golfer would care about this week (results, rule or tour news, a practical playing idea). A thin week gets fewer stories, down to one; never pad it. Skip live blogs, betting, gear deals and listicles.
3. Open each chosen story's page and read it before you write about it. Every name, number and date must be on that page; never copy a sentence, never quote more than a few words, never use the source's photos. In your own words:
   - `headline`: short and plain.
   - `body`: 60 to 150 words on what happened, enough that a golfer could retell it; `validate` refuses eight words in a row taken from the story's title, feed excerpt or share card.
   - `whyItMatters`: one sentence of 6 to 35 words on why it matters to a club golfer.
   - Last, the issue's `editorNote`: 60 to 120 words in our own voice on what the week in golf was about, drawn only from the chosen stories' pages, with no disc golf.
4. The issue is news, not an advert. It has no lead clip and no store link, and it never names an app (ours or anyone else's), an app store or a download.
5. Write `src/data/sunday/D.json` with exactly these fields, in this order: `slug` = `D`, the next `number`, `date` = "Sunday <d> <Month> <yyyy>", `title` = "The Sunday post, issue <n>", a `pageTitle` naming the week's two or three main stories and ending in " | SundayStroke", a one-line `summary`, the `editorNote`, then `sections`: a `golf` section and a `tracer` section (the page heads it "Disc golf"; leave out a section with no story), each only `key` and `items`. Each item is `headline`, `body`, `whyItMatters`, `sourceLabel`, `sourceUrl`, `published` and `preview`: `sourceLabel` is the feed's name as `paths.candidates` gives it; `sourceUrl` is the story's `link`, unchanged; `published` is the story's `published` as a Madrid `yyyy-mm-dd` day; `preview` is `null` until `node sunday/cli.ts preview --date D` fills it from the source's share card: run that before `validate` and after changing a story, and never edit `preview` by hand. Earlier issue files carry a `leadText`, `leadClips` and section `heading`s from an older layout, and lack the newer fields: never copy their shape.
6. Never change any other file. Earlier issues, their dates and their wording stay exactly as published.
7. Copy rules for everything you write: plain words for golfers; no prices; no promotion: never name an app, an app store or a download; never the word "shot" followed by "tracer"; nothing about baseball; never name tools, vendors, the tech stack or how this run works; disc golf only in the Disc golf section.
8. `node sunday/cli.ts validate --date D`, then `npm run build`. Fix what they report and run both again until they pass.

## check

`node sunday/cli.ts check --date D` hands the issue to a second, independent checker that reads every source page, confirms or rejects each item and the editor's note, drops the rejected items and any dead link, and records what it checked. Don't touch the issue file after it; if it rejects the editor's note it fails, and the run stops there. If it says nothing was confirmed, stop: there is no issue this week, and it has recorded that, so the factory's check after your run passes. Otherwise `npm run build`.

## open-pr

`node sunday/cli.ts open-pr --date D` restores the checked issue (so a later run can open the pull request without writing it again), builds the site, commits the issue on its own `factory/` branch and opens the pull request with the `factory` label, listing each kept and rejected item with the checker's reason and a fact check of every story. You are done: the factory reviews the pull request, asks the owner to approve the issue's exact text, and merges and publishes it only after the owner taps Publish. Never merge it yourself.

## report

The pilot has had its four issues, so the owner needs numbers to keep or stop it.

1. Read, in the owner's logged-in Chrome (how: `/Users/ivkin/.claude/projects/-Users-ivkin-my-GolfGPS/memory/reference-owner-browser-automation.md`), the visits to each `/sunday/<date>/` page from the site's cookie-free page analytics. The news pages carry no store links, so there are no downloads to count.
2. Draw one portrait image, 1080 px wide: visits per issue as bars, labelled in plain words. Make it a self-contained HTML page with inline SVG, and shoot it with `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-features=MacAppCodeSignClone --hide-scrollbars --window-size=1080,1350 --screenshot=<abs png> file://<abs html>`. Open the PNG and look at it.
3. `uv run --frozen --project <factoryRuntime from plan> factory notify golfgps "<b>The Sunday post pilot: 4 issues, <visits> visits.</b> <one line on what the numbers say>" --image <png> --digest`. If the number can't be read, say so instead of guessing.
4. `node sunday/cli.ts mark-reported`
