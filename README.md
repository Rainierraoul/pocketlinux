# Pocket Linux — TinyEMU iPhone prototype

A **phone-first**, self-hosted experiment based on Fabrice Bellard's TinyEMU/JSLinux.
No account is required to *use* the deployed app; no remote Linux server is involved.
A GitHub account is required if you choose to deploy it with GitHub Pages.

**What this version actually does:** It packages Bellard's public **2019 precompiled
JSLinux RISC-V demo** alongside an iPhone-friendly launcher, touchscreen control keys,
a simple command input, an installable web-app manifest, and an opt-in offline asset cache.
The Linux kernel and guest programs really execute in WebAssembly on your phone.

**What this version DOES NOT yet do:** Persist changes made inside Linux across a VM
restart; provide modern Alpine packages; guarantee background execution; demonstrate
better performance than iSH or UTM SE; or compile the latest JSLinux 2026 x86-64
implementation. The upstream demo's root device behaves like a writable disk but its
writes are ephemeral in this browser build. Browser offline caching **only saves VM
assets**, not guest filesystem modifications. No network access is configured inside
the Linux guest. The 2019 Linux image is a *boot and input baseline*, not the final OS.

## Run it using only an iPhone

### Option A — GitHub Codespaces (least command-line work)

1. Download `pocketlinux-tinyemu-starter.zip` from the ChatGPT conversation to **Files**.
2. In Safari, open [github.com/new](https://github.com/new), create a repository
   (e.g. `pocketlinux`), and make it **Public** if you want free GitHub Pages
   on GitHub Free. **Tick Add a README file** to create the `main` branch.
3. From the repository, open **Code → Codespaces → Create codespace on main**.
   GitHub's cloud editor runs in Safari. You may need **Request Desktop Website**.
4. In its Files Explorer, upload the ZIP file to the repository root. If the
   mobile browser cannot upload it, use **Working Copy** or another iOS Git client
   to import the uncompressed folder and commit it instead.
5. In the Codespaces terminal, run (adjust the filename if needed; this replaces
   the repository's initial placeholder README):

   ```sh
   unzip -o pocketlinux-tinyemu-starter.zip
   git add .
   git commit -m "Initial TinyEMU iOS prototype"
   git push -u origin main
   ```

6. Back in your GitHub repository, open **Settings → Pages → Build and deployment →
   Source → GitHub Actions**. Run the **Build and deploy Pocket Linux** workflow
   in **Actions** if a run was not triggered automatically.
7. Once GitHub Pages deployment succeeds, open the Pages URL on your iPhone.
   It will usually have the form `https://YOUR-USERNAME.github.io/pocketlinux/`.
8. In Safari, use **Share → Add to Home Screen**. Use **Save offline** to attempt
   to cache all emulator assets. iOS may still remove stored website data.

GitHub Codespaces has quotas, eligibility requirements and possible charges; don't
leave a Codespace running unnecessarily. GitHub Pages deployment only needs Actions,
not a permanently running Codespace.

### Option B — No Codespaces

Uncompress the ZIP in the iOS Files app. Use an iOS Git client such as Working Copy
to create or clone your repository, import the contents **including `.github/`**, commit,
and push. Then follow steps 6–8 above. Git client features and pricing vary.

### What to type when it boots

```sh
uname -a
cat /proc/cpuinfo
mount
echo hello > /tmp/example
cat /tmp/example
```

Try sending commands through the **Type a command…** field at the bottom. The **^C**,
**^D**, **ESC**, **TAB**, and arrow buttons inject control characters into the actual
Linux console. Bluetooth keyboard interaction with the upstream terminal may work,
but has not been tested on an iPhone in this project.

## Files

- `site/index.html`, `site/app.js`, `site/app.css` — the mobile launcher UI.
- `site/sw.js` — same-origin offline cache. Does **not** persist guest changes.
- `scripts/stage.sh` — fetches Bellard's upstream 2019 precompiled demo archive,
  then copies the locally authored launcher over it.
- `scripts/asset_list.py` — generates the list used by **Save offline**.
- `scripts/verify.py` — build-output sanity checks, **not** a browser/boot test.
- `.github/workflows/deploy.yml` — automatically builds and publishes with Pages.
- `docs/ARCHITECTURE.md` — design and progression toward a real persistent Linux.

## Trust and security

The deployment downloads third-party executable WebAssembly and guest software.
For a supply-chain-hardened build, set `BELLARD_ARCHIVE_SHA256` to a verified SHA-256
before publishing. This starter leaves it unset because the archive's digest could
not be checked during creation. Do not type passwords, sensitive credentials or
private information into an experimental guest. The app does not intentionally send
terminal input to a remote backend. The GitHub Pages server serves static files.

This is an independent prototype **based on** TinyEMU/JSLinux; not an official Bellard
release, and it does not claim Bellard maintains or endorses the UI.

## Source and licensing

- Original TinyEMU: <https://bellard.org/tinyemu/> (MIT licence)
- Original self-hostable demo: <https://bellard.org/tinyemu/jslinux-2019-12-21.tar.gz>
- JSLinux technical notes: <https://bellard.org/jslinux/tech.html>

The upstream archive is downloaded by the workflow and remains subject to its
included licensing terms; Linux/BusyBox have their own open-source licences. The
new launcher and build scripts in this package are provided under MIT (see `LICENSE`).
Do not assume Bellard's latest hosted x86-64 emulator has the same source availability.

## Local build on a Mac/Linux host (optional)

```sh
bash scripts/stage.sh
python3 scripts/verify.py public
python3 -m http.server --directory public 8000
```

Open http://localhost:8000/. **Do not open `index.html` as a `file://` URL**;
WebAssembly and VM disk block loading require a web server.

## Tests performed on the starter project

- JavaScript syntax validation via Node
- Python and shell script syntax checks
- Static manifest/asset and required-file checker using synthetic fixtures

An actual Safari boot, iPhone performance, persistence, and the remote archive
retrieval remain **unverified in this environment**.
