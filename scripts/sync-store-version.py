#!/usr/bin/env python3
"""Bump latest_version in dist/extension-news.json once a release is live in every store.

The extension's popup nudges users whose browser has not installed an available
update (news.ts shouldShowUpdateNotice, after a 5-day grace). That nudge is only
honest when the version really is downloadable for that user, so this script
takes the MINIMUM version across the stores: it waits for the slowest one
(Chrome is usually last) instead of over-claiming a version some users cannot
get yet. It never downgrades, and it makes no change unless every enabled store
answered.

Stores are queried through their own machine-readable endpoints, not by scraping
store HTML (both Chrome and Edge render versions client-side, so HTML would be
brittle):
  chrome  - clients2.google.com update manifest, the one Chrome itself polls
  edge    - microsoftedge.microsoft.com/addons/getproductdetailsbycrxid
  firefox - addons.mozilla.org API v5

Run it from cron on a checkout that exists only for this purpose. It commits and
pushes dist/extension-news.json, and Netlify deploys the result.

Exit codes: 0 ok (changed or already current), 1 error, 2 stores disagree or a
store is behind (normal during a rollout; the next run picks it up).
"""

import argparse
import fcntl
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

CHROME_ID = 'ickfhlplfbipnfahjbeongebnmojbnhm'
EDGE_CRX_ID = 'cchkadjmggcjoldlfmccdindjgadjgbj'
AMO_SLUG = 'reveddit-real-time'
# Identity assertions. A store id that is changed or mistyped can resolve to
# SOMEONE ELSE'S extension and answer 200 with their version, which would push
# a wrong latest_version to every user. Echoing the requested id back proves
# nothing (these endpoints always do), so each store is checked against
# something it reports independently of the id we sent:
#   edge     - product name
#   firefox  - guid (we query by slug, so guid is a separate identifier)
#   chrome   - the update manifest exposes no name; an unknown id answers
#              status="error-unknownApplication", and the family guard below
#              catches an id that lands on a real but foreign extension.
AMO_GUID = 'real-time-stable@reveddit.com'
EXPECTED_NAME_SUBSTRING = 'reveddit'
# A foreign extension's version looks nothing like ours (uBlock Origin Lite
# answers 2026.825.1619). Refuse a jump of more than one major version; a
# deliberate 0.x -> 1.0 release still passes.
MAX_MAJOR_JUMP = 1

NEWS_PATH = 'dist/extension-news.json'
UA = 'reveddit-store-version-check (+https://www.reveddit.com)'
TIMEOUT = 30
RETRIES = 3
RETRY_SLEEP = 5

VERSION_RE = re.compile(r'^\d+(\.\d+){1,3}$')


def log(msg):
    print(f'[{time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}] {msg}', flush=True)


def fetch(url, accept):
    last = None
    for attempt in range(1, RETRIES + 1):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
            with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
                return r.read().decode('utf-8', 'replace')
        except (urllib.error.URLError, OSError) as e:
            last = e
            if attempt < RETRIES:
                time.sleep(RETRY_SLEEP * attempt)
    raise RuntimeError(f'fetch failed after {RETRIES} tries: {url}: {last}')


def parse_version(raw, store):
    v = (raw or '').strip()
    if not VERSION_RE.match(v):
        raise RuntimeError(f'{store}: implausible version {v!r}')
    return v


def version_tuple(v):
    parts = [int(x) for x in v.split('.')]
    return tuple(parts + [0] * (4 - len(parts)))


def get_chrome():
    # The update manifest Chrome polls: an <updatecheck version="..."> attribute.
    url = (
        'https://clients2.google.com/service/update2/crx'
        '?response=updatecheck&prodversion=140&acceptformat=crx3'
        f'&x=id%3D{CHROME_ID}%26uc'
    )
    xml = fetch(url, 'application/xml')
    if 'status="ok"' not in xml:
        raise RuntimeError(f'chrome: no ok status in manifest: {xml[:200]}')
    appid = re.search(r'<app[^>]*\bappid="([^"]+)"', xml)
    if not appid or appid.group(1) != CHROME_ID:
        raise RuntimeError(f'chrome: manifest describes {appid and appid.group(1)!r}, expected {CHROME_ID!r}')
    m = re.search(r'<updatecheck[^>]*\bversion="([0-9.]+)"', xml)
    if not m:
        raise RuntimeError(f'chrome: no version in manifest: {xml[:200]}')
    return parse_version(m.group(1), 'chrome')


def get_edge():
    url = f'https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/{EDGE_CRX_ID}'
    data = json.loads(fetch(url, 'application/json'))
    got = data.get('crxId')
    if got != EDGE_CRX_ID:
        raise RuntimeError(f'edge: response describes {got!r}, expected {EDGE_CRX_ID!r}')
    name = (data.get('name') or '')
    if EXPECTED_NAME_SUBSTRING not in name.lower():
        raise RuntimeError(f'edge: id resolves to {name!r}, not a reveddit extension')
    return parse_version(data.get('version'), 'edge')


def get_firefox():
    url = f'https://addons.mozilla.org/api/v5/addons/addon/{AMO_SLUG}/'
    data = json.loads(fetch(url, 'application/json'))
    got = data.get('guid')
    if got != AMO_GUID:
        raise RuntimeError(f'firefox: response describes {got!r}, expected {AMO_GUID!r}')
    return parse_version((data.get('current_version') or {}).get('version'), 'firefox')


GETTERS = {'chrome': get_chrome, 'edge': get_edge, 'firefox': get_firefox}


def git(repo, *args, check=True):
    p = subprocess.run(
        ['git', '-C', repo, *args], capture_output=True, text=True, timeout=180
    )
    if check and p.returncode != 0:
        raise RuntimeError(f'git {" ".join(args)} failed: {p.stderr.strip()}')
    return p.stdout.strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--repo', default=os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                    help='website repo checkout (default: the repo holding this script)')
    ap.add_argument('--branch', default='master')
    ap.add_argument('--stores', default='chrome,edge,firefox',
                    help='comma-separated subset to require (default: all three)')
    ap.add_argument('--check', action='store_true', help='print store versions and exit')
    ap.add_argument('--self-test', action='store_true', help='verify version ordering offline and exit')
    ap.add_argument('--dry-run', action='store_true', help='report what would change, write nothing')
    ap.add_argument('--no-push', action='store_true', help='commit locally but do not push')
    args = ap.parse_args()

    if args.self_test:
        # Ordering must be numeric, not lexicographic: '0.0.5.9' < '0.0.5.21'
        # is true numerically and false as strings, and a future 1.0.0 must
        # outrank every 0.x.
        pairs = [('0.5.21', '1.0.0'), ('0.0.5.9', '0.0.5.21'), ('0.0.9.0', '0.0.10.0'),
                 ('0.0.5.21', '0.1.0'), ('1.0.0', '1.0.0.1'), ('0.0.5.21', '1.0')]
        for lo, hi in pairs:
            assert version_tuple(lo) < version_tuple(hi), f'{lo} should sort below {hi}'
        assert version_tuple('1.0') == version_tuple('1.0.0.0')
        for bad in ('', 'v1.0', '1', '1.2.3.4.5', 'latest', '1.2.3-beta'):
            try:
                parse_version(bad, 'test')
            except RuntimeError:
                pass
            else:
                raise AssertionError(f'{bad!r} should have been rejected')
        log(f'self-test OK ({len(pairs)} ordering pairs, 6 rejections)')
        return 0

    stores = [s.strip() for s in args.stores.split(',') if s.strip()]
    unknown = [s for s in stores if s not in GETTERS]
    if unknown:
        log(f'ERROR unknown store(s): {unknown}')
        return 1
    if not stores:
        log('ERROR no stores selected')
        return 1

    # A store that errors must not be read as "behind": abort with no change.
    versions = {}
    for s in stores:
        try:
            versions[s] = GETTERS[s]()
            log(f'{s}: {versions[s]}')
        except Exception as e:
            log(f'ERROR {s}: {e}')
            return 1

    if args.check:
        return 0

    news_file = os.path.join(args.repo, NEWS_PATH)
    if not os.path.isfile(news_file):
        log(f'ERROR not found: {news_file}')
        return 1

    lock_path = os.path.join(args.repo, '.sync-store-version.lock')
    with open(lock_path, 'w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError:
            log('another run holds the lock; exiting')
            return 0

        if not args.dry_run:
            # Fail rather than merge: this checkout should have no local work.
            git(args.repo, 'fetch', 'origin', args.branch)
            git(args.repo, 'checkout', args.branch)
            git(args.repo, 'merge', '--ff-only', f'origin/{args.branch}')

        with open(news_file, encoding='utf-8') as f:
            feed = json.load(f)

        current = feed.get('latest_version')
        # Slowest store wins: the newest version available to EVERY user.
        target = min(versions.values(), key=version_tuple)
        log(f'feed latest_version={current} target={target} (min across {",".join(stores)})')

        # Family guard: a wrong-but-live store id would otherwise publish a
        # stranger's version number to every user.
        if current:
            jump = version_tuple(target)[0] - version_tuple(current)[0]
            if jump > MAX_MAJOR_JUMP:
                log(f'ERROR refusing {current} -> {target}: major jumps by {jump}. '
                    'If this release is real, raise MAX_MAJOR_JUMP; otherwise check the store ids.')
                return 1

        if len(set(versions.values())) > 1:
            log('stores disagree (rollout in progress); using the minimum')

        if current and version_tuple(target) == version_tuple(current):
            log('nothing to do: feed is current')
            return 0
        if current and version_tuple(target) < version_tuple(current):
            # Feed claims a version no store serves: a pulled release, or a
            # store reporting stale data. Never downgrade; surface it instead.
            log(f'WARNING feed ({current}) is ahead of every store ({target}); leaving it alone')
            return 2

        feed['latest_version'] = target
        feed['latest_version_published_utc'] = int(time.time() * 1000)

        if args.dry_run:
            log(f'DRY RUN would set latest_version={target}')
            return 0

        tmp = news_file + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(feed, f, indent=2, ensure_ascii=False)
            f.write('\n')
        os.replace(tmp, news_file)

        git(args.repo, 'add', NEWS_PATH)
        if not git(args.repo, 'status', '--porcelain', NEWS_PATH):
            log('file unchanged after write; nothing to commit')
            return 0
        # --no-verify: husky hooks need node_modules, which a cron checkout
        # has no reason to install for a one-field JSON edit.
        git(args.repo, 'commit', '--no-verify', '-m',
            f'news: latest_version {target}\n\n'
            f'Live in {", ".join(f"{s} {v}" for s, v in sorted(versions.items()))}. '
            'Set automatically by scripts/sync-store-version.py.')
        if args.no_push:
            log(f'committed (not pushed): latest_version={target}')
        else:
            git(args.repo, 'push', 'origin', args.branch)
            log(f'pushed: latest_version={target}')
        return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(1)
    except Exception as e:
        log(f'ERROR unhandled: {e}')
        sys.exit(1)
