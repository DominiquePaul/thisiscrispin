# Focus Feed

A Chrome / Arc extension for X (Twitter) and LinkedIn that:

- **Hides the feed** (X Home + Explore, LinkedIn home feed, plus trending/news sidebars). The post composer stays, so you can still post.
- **Hides notifications but keeps messages.** It removes the Notifications nav item, the unread count in the tab title (e.g. `(3)`) and LinkedIn's red badges on everything except Messaging. Opening the notifications page directly shows a "Notifications are hidden" card.
- **Lets you unlock the feed with friction.** Click **Show feed**, then keep the page open and focused for **15 seconds**. Switching tabs, switching apps or navigating away resets the timer. The feed stays unlocked for that tab until you reload or click **Hide feed again**.

## Install (Chrome)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this `focus-extension` folder

## Install (Arc)

1. Open `arc://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and select this `focus-extension` folder

After editing the code, click the reload icon on the extension card and refresh X/LinkedIn.

## Files

- `manifest.json`: Manifest V3, content scripts only, no permissions required
- `focus.css`: the hiding rules (injected at `document_start`, so nothing flashes)
- `focus.js`: page detection, the 15-second unlock timer and title cleanup

## When a site changes its markup

X and LinkedIn change their DOM regularly. If something reappears, inspect it and add its selector to `focus.css`. The X rules rely on `data-testid` attributes, which are fairly stable. LinkedIn randomizes its class names, so `focus.js` finds the "Start a post" box by its text and hides everything around it. If it can't find that box (e.g. an unsupported interface language), the whole feed column stays hidden and the card shows a **Write a post** button instead. Add your language's wording to `COMPOSER_TEXT` in `focus.js` if needed. To change the wait time, edit `UNLOCK_SECONDS` in `focus.js`.
