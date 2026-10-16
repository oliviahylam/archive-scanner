# The Archive — Scanner

A mobile tool from the speculative thesis project **Terms of Living** (2046).
Point a phone at a real object, name it, and it becomes a catalogued lot in the Archive,
recovered from a randomly generated citizen.

Design reference: `reference/archive-design.png`.

The Home and Choices tabs hold the rest of the app from the Figma wireframes: a welcome screen
(first visit only), today at a glance, the evening choice and the finished day. The app opens on Home;
the scanner is under Inventory (`#/inventory`). Open `#/start` to clear your answers and see the
welcome screen again.

## Where things are

| You want to…                                        | Edit this                         |
| --------------------------------------------------- | --------------------------------- |
| Change number formats, date range, description bank | `src/archive-rules.ts`            |
| Change the 6 seed lots (names, citizens, text)      | `src/seed.ts`                     |
| Replace the seed photos                             | `public/lots/` (see below)        |
| Change colors, fonts, sizes                         | `src/theme.css` (top of the file) |
| Change Home, Choices and the day schedule text     | `src/day.ts`                      |

### Seed photos

Put cutout PNGs with a transparent background in `public/lots/`, using exactly these names
(they replace the placeholders):

| Object        | File                       |
| ------------- | -------------------------- |
| Thumbtack     | `public/lots/obj-0816.png` |
| Receipt       | `public/lots/obj-0917.png` |
| Cassette tape | `public/lots/obj-0612.png` |
| Clothing tags | `public/lots/obj-1297.png` |
| Earbuds       | `public/lots/obj-1632.png` |
| Phone         | `public/lots/obj-0791.png` |

Square-ish images around 800–1200px wide work best. Crop tightly around the object.

## Run it

You need [Node.js](https://nodejs.org) (the LTS version) installed once.

```bash
npm install        # first time only
npm run dev        # open http://localhost:5173 on this computer
```

### On your phone (same wifi as your computer)

```bash
npm run phone
```

The terminal prints a `Network:` address such as `https://192.168.1.23:5173`.
Type it into your phone's browser. You'll see a "connection not private" warning
the first time: tap **Advanced → Proceed** (Chrome) or **Show Details → visit this website** (Safari).
This is expected: the certificate is made on your computer, and https is required for the camera.

## Permanent link (Vercel)

1. Sign in at <https://vercel.com> with GitHub.
2. **Add New… → Project**, choose `archive-scanner`, click **Deploy**. No settings to change.
3. Every push to `main` updates the main link. Other branches get their own preview link,
   shown on the project's **Deployments** page.

## Background removal

Objects are cut out on the phone itself with
[@imgly/background-removal](https://github.com/imgly/background-removal-js) (small model, ~44 MB).
The model is served by this app from `/cutout/`. `scripts/copy-cutout-model.mjs` copies it there
before every build, so nothing depends on an outside server. Each phone downloads it once,
quietly in the background while the Inventory is open, and keeps it for offline use.

If the background can't be removed, the photo is kept, cropped to a circle, and the visitor
can carry on.

The library is licensed under the AGPL, which asks that this app's source code stays public.
This repository being public covers that.

## Shared Archive (everyone sees every lot)

Lots added by visitors are saved online, so every phone sees the same Archive.
The Inventory checks for new lots every 20 seconds. It works with two free stores,
connected once in Vercel:

1. In the Vercel project, open **Storage → Create Database → Blob**. Name it `archive-photos`.
   If asked, choose **Public** access. Click **Create**, then **Connect** it to the project
   (all environments).
2. Again **Storage → Create Database**, choose **Upstash for Redis** (from the Marketplace),
   the **Free** plan, and a region near you. Create it and **Connect** it to the project.
3. Redeploy (any push to `main` does this, or **Deployments → ⋯ → Redeploy**).

Until both are connected, the app keeps working, saving lots on each phone only.

- Photos: Vercel Blob (`lots/<id>.png`). Records: Redis hash `archive:lots`.
- Code: `api/lots.ts` (the Vercel function) and `server/archive-api.ts` (checks and numbering:
  taken or malformed numbers are replaced, names capped at 24 characters).
- `npm run dev` uses an in-memory stand-in, so you can try it without Vercel.
