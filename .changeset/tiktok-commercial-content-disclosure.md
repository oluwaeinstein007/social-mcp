---
"social-mcp": minor
---

TikTok: support the commercial-content disclosure flags required by the Content Posting API

`directPostVideo` now accepts `brandOrganicToggle` ("Your brand" — the creator promoting their
own business) and `brandContentToggle` ("Branded content" — a paid partnership promoting someone
else), and sends them as `brand_organic_toggle` / `brand_content_toggle` in `post_info`. Both are
exposed on the `TIKTOK_DIRECT_POST_VIDEO` tool.

Until now there was no way to transmit either flag, so an integrator could not disclose commercial
content at all — which TikTok's API terms require for any promotional post. A UI for it would have
been a control that saved, rendered and changed nothing.

Posting branded content with `privacyLevel: "SELF_ONLY"` is now refused locally with an
explanatory error instead of being sent to TikTok and returning an opaque provider failure.

Both parameters default to `false` (not commercial content), which is the existing behaviour, and
they are appended positionally rather than collected into an options object — `directPostVideo` is
called directly by consumers that import the built service, so reordering would break them. No
existing caller needs to change.
