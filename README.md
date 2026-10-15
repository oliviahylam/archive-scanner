# The Archive — Scanner

A mobile tool from the speculative thesis project **Terms of Living** (2046).
Point a phone at a real object, name it, and it becomes a catalogued lot in the Archive,
recovered from a randomly generated citizen.

Design reference: `reference/archive-design.png`.

## Where things are

| You want to…                                        | Edit this                         |
| --------------------------------------------------- | --------------------------------- |
| Change number formats, date range, description bank | `src/archive-rules.ts`            |
| Change the 6 seed lots (names, citizens, text)      | `src/seed.ts`                     |
| Replace the seed photos                             | `public/lots/` (see below)        |
| Change colors, fonts, sizes                         | `src/theme.css` (top of the file) |

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
