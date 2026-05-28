# Dating Invite MVP

A small dependency-free Node app. The frontend is a single-page interactive invite, and the backend stores submissions and serves a protected admin page.

## Live Site

Open the public invite page:

```text
https://date.cocopiece.top/
```

## Run Locally

```powershell
npm test
npm start
```

Open:

- Invite page: `http://127.0.0.1:3000/`

## Replace The Photo

The homepage currently uses:

```text
public/assets/invite-photo.svg
```

Before publishing, you can add a compressed square photo such as:

```text
public/assets/invite-photo.jpg
```

Then change the image path in `public/index.html` from `/assets/invite-photo.svg` to `/assets/invite-photo.jpg`.

## Edit Copy

Most editable copy lives in:

```text
public/js/copy.js
```

It includes:

- Intro title, body, YES/NO text, and No-button hints
- Date step copy
- Activity step copy and choices
- Result step copy

## View Results

After a user submits the form, the server appends one JSON line to:

```text
data/responses.jsonl
```

The admin page displays submission time, date, time slot, activity, user clue, and note.

## Deploy

The lightest deployment path is:

```bash
cd /path/to/datingInv
npm test
PORT=3000 node src/server.js
```

If your server already has Nginx, reverse proxy the domain to `127.0.0.1:3000`. This project does not require a database or external dependencies.

## Optional Enhancements

- Email or Telegram notification after submission
- Multiple invite links
- Richer result-page animation
- Export button on the admin page
