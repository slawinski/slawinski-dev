# About and Contact

Routes:
- `/about`
- `/contact`

# Part A — About

## 1. Goal

Tell a concise professional/personal story and make the person behind the work feel tangible.

Avoid reproducing a complete CV.

---

## 2. Desktop layout

Top section:
- `ABOUT`;
- short intro;
- portrait/photo print;
- handwritten `Hi!` or similar small annotation.

Body:
- narrative prose;
- selected timeline;
- working principles;
- personal-interest fragments/objects if desired;
- contact CTA.

---

## 3. Narrative

Use 3–6 short paragraphs, not one giant biography.

Suggested themes:
- what kind of software work is interesting;
- how career/work evolved;
- interest in product/UX as well as engineering;
- teaching/speaking/community;
- non-work interests.

No need to enumerate every employer.

---

## 4. Timeline

Optional but recommended.

Data:
- year/range;
- label;
- company/project/event;
- one-line context.

Visual:
- paper strips / stamped dates;
- standard DOM order;
- not a horizontal-only timeline.

Mobile:
- vertical list.

CMS may either:
- store timeline entries in About global;
- or keep this small stable content directly in code if not editorially changed often.

Recommendation: CMS global.

---

## 5. "How I work" section

3–5 principles, e.g.:
- product-minded;
- simplicity;
- performance/accessibility;
- mentorship;
- iteration.

These are short text items, not score bars.

---

## 6. Skills/technology

Do not add proficiency percentages.

If technology is shown:
- use a concise "I work with" text list;
- prioritize current/relevant stack;
- max ~12 visible items.

No enormous icon grid.

---

# Part B — Contact

## 7. Goal

Make contacting the author obvious in less than one screen on desktop and roughly one screen on mobile.

---

## 8. Contact layout

Desktop:
- title and short copy left;
- postcard/address-label object right;
- primary email CTA;
- social links.

Mobile:
- title;
- copy;
- email;
- social links;
- decorative postcard after actions.

---

## 9. Primary contact

Use a real `mailto:` link.

Button copy:
- `Send me an email`
or
- displayed email address.

Do not hide email behind JavaScript.

If spam becomes a problem, revisit later.

---

## 10. Availability status

Optional CMS field:

```text
availability:
  hidden
  open
  selective
  unavailable
```

and a short custom line.

Avoid traffic-light colors as the only indicator.

---

## 11. Contact form

Out of scope by default.

Only add if there is a real product requirement.

If added later:
- server-side validation;
- spam protection;
- clear privacy behavior;
- no third-party form widget that breaks visual consistency.

---

## 12. Acceptance criteria

About:
- biography remains readable without decorative media;
- mobile timeline is linear;
- no skill bars.

Contact:
- email is a normal accessible link;
- contact actions are visible without novelty interaction;
- social links have visible labels or accessible names.
