from datetime import datetime

from .curriculum import CAREER_MAP, CAREERS, CONCEPT_MAP, CONCEPTS, PROJECTS, TUTOR_CONTENT
from .questions import QUESTIONS


def ancestor_closure(ids):
    seen = set()
    stack = list(ids)
    while stack:
        cid = stack.pop()
        if cid in seen:
            continue
        seen.add(cid)
        c = CONCEPT_MAP.get(cid)
        if c:
            stack.extend(c["prereqs"])
    return seen


def descendants(cid):
    return [c["id"] for c in CONCEPTS if cid in c["prereqs"]]


def days_since(dt):
    if dt is None:
        return None
    return (datetime.utcnow() - dt).days


def clamp(n, lo, hi):
    return max(lo, min(hi, n))


def bucket(mastery):
    if mastery is None or mastery <= 0:
        return "unstarted"
    if mastery < 45:
        return "weak"
    if mastery < 75:
        return "developing"
    return "strong"


def knowledge_dict(knowledge_states):
    return {
        ks.concept_id: {"mastery": round(ks.mastery or 0), "last_studied": ks.last_studied, "attempts": ks.attempts}
        for ks in knowledge_states
    }


def knowledge_score(k):
    vals = [k.get(c["id"], {}).get("mastery", 0) for c in CONCEPTS]
    return round(sum(vals) / len(vals))


CORE_READINESS_IDS = ["functions", "control_flow", "oop_basics", "exceptions", "data_structures_py", "algorithms_py", "testing_py"]


def readiness_score(k):
    vals = [k.get(cid, {}).get("mastery", 0) for cid in CORE_READINESS_IDS]
    return round(sum(vals) / len(vals))


def career_match(career_id, k):
    w = CAREER_MAP[career_id]["weights"]
    num = 0.0
    den = 0.0
    for cid, weight in w.items():
        num += k.get(cid, {}).get("mastery", 0) * weight
        den += weight * 100
    return round((num / den) * 100) if den else 0


def all_career_matches(k):
    out = [{"career": c, "score": career_match(c["id"], k)} for c in CAREERS]
    return sorted(out, key=lambda x: -x["score"])


def career_gaps(career_id, k):
    w = CAREER_MAP[career_id]["weights"]
    out = []
    for cid, weight in w.items():
        mastery = k.get(cid, {}).get("mastery", 0)
        out.append({"concept": CONCEPT_MAP[cid], "weight": weight, "mastery": mastery, "gap": 100 - mastery})
    out.sort(key=lambda x: (-x["weight"], x["mastery"]))
    return out


def decay_alerts(k):
    out = []
    for c in CONCEPTS:
        ks = k.get(c["id"], {})
        mastery = ks.get("mastery", 0)
        d = days_since(ks.get("last_studied"))
        if mastery > 0 and d is not None and d >= 14:
            out.append({"concept": c, "mastery": mastery, "days": d, "review_minutes": clamp(round(d / 2), 10, 40)})
    out.sort(key=lambda x: -x["days"])
    return out


def best_projects(k, n=3):
    out = []
    for p in PROJECTS:
        avg = sum(k.get(cid, {}).get("mastery", 0) for cid in p["concepts"]) / len(p["concepts"])
        out.append({"project": p, "readiness": round(avg)})
    out.sort(key=lambda x: -x["readiness"])
    return out[:n]


def roadmap_for(career_id, k):
    if not career_id:
        return []
    required = list(CAREER_MAP[career_id]["weights"].keys())
    closure = ancestor_closure(required)
    weak = []
    for cid in closure:
        mastery = k.get(cid, {}).get("mastery", 0)
        if mastery < 75:
            c = dict(CONCEPT_MAP[cid])
            c["mastery"] = mastery
            weak.append(c)
    weak.sort(key=lambda c: (c["level"], c["diff"]))

    months = []
    for i in range(0, len(weak), 3):
        months.append({"month": len(months) + 1, "concepts": weak[i:i + 3]})
    months.append({
        "month": len(months) + 1,
        "concepts": [{
            "id": "_project", "name": "Capstone Project", "level": 99, "diff": 0, "prereqs": [],
            "blurb": "Apply everything in a portfolio project.", "is_project": True, "mastery": 0,
        }],
    })
    return months


def recommendations(student_name, k, career_goal):
    recs = []

    learn_target = None
    if career_goal:
        for g in career_gaps(career_goal, k):
            if g["mastery"] < 60:
                learn_target = g
                break
    if not learn_target:
        started = [{"concept": c, "mastery": k.get(c["id"], {}).get("mastery", 0)} for c in CONCEPTS
                   if k.get(c["id"], {}).get("mastery", 0) > 0]
        started.sort(key=lambda x: x["mastery"])
        if started:
            learn_target = {"concept": started[0]["concept"], "mastery": started[0]["mastery"], "weight": 1}

    if learn_target:
        recs.append({
            "type": "learn", "icon": "🎯", "title": f"Revise {learn_target['concept']['name']}",
            "text": f"Your mastery here is {learn_target['mastery']}%" + (
                f", and it's important for {CAREER_MAP[career_goal]['name']}." if career_goal else "."
            ),
            "factors": [
                f"Current mastery: {learn_target['mastery']}%",
                (f"Relevance to goal: {'High' if learn_target.get('weight', 1) >= 0.8 else 'Medium'}"
                 if career_goal else "Relevance: your weakest active topic"),
                f"Prerequisite for: {', '.join(CONCEPT_MAP[d]['name'] for d in descendants(learn_target['concept']['id'])) or '—'}",
            ],
        })

    decay = decay_alerts(k)
    if decay:
        d = decay[0]
        recs.append({
            "type": "revision", "icon": "🧠", "title": f"{d['concept']['name']} knowledge is fading",
            "text": f"Last studied {d['days']} days ago. A {d['review_minutes']}-minute review should restore it.",
            "factors": [f"Mastery: {d['mastery']}%", f"Last studied: {d['days']} days ago",
                        f"Recommended review: {d['review_minutes']} minutes"],
        })

    matches = all_career_matches(k)
    if matches:
        top = matches[0]
        recs.append({
            "type": "career", "icon": "💼", "title": f"You're {top['score']}% matched to {top['career']['name']}",
            "text": ("This is your current goal — keep closing the gaps below."
                     if career_goal == top["career"]["id"]
                     else "Consider setting this as your career goal on the Career AI tab."),
            "factors": [f"Match score: {top['score']}%", f"Based on {len(top['career']['weights'])} weighted concepts",
                        (f"Next best match: {matches[1]['career']['name']} ({matches[1]['score']}%)"
                         if len(matches) > 1 else "—")],
        })

    proj = best_projects(k, 1)
    if proj:
        p = proj[0]
        recs.append({
            "type": "project", "icon": "🚀", "title": f"Build: {p['project']['title']}", "text": p["project"]["blurb"],
            "factors": [f"Skill readiness: {p['readiness']}%",
                        f"Concepts used: {', '.join(CONCEPT_MAP[cid]['name'] for cid in p['project']['concepts'])}",
                        f"Tech: {', '.join(p['project']['tech'])}"],
        })

    weak_started = [{"concept": c, "mastery": k.get(c["id"], {}).get("mastery", 0)} for c in CONCEPTS
                     if 0 < k.get(c["id"], {}).get("mastery", 0) < 65]
    weak_started.sort(key=lambda x: x["mastery"])
    if weak_started:
        w = weak_started[0]
        recs.append({
            "type": "quiz", "icon": "🎤", "title": f"Practice quiz: {w['concept']['name']}",
            "text": f"A short quiz here will sharpen a concept sitting at {w['mastery']}% mastery.",
            "factors": [f"Current mastery: {w['mastery']}%",
                        f"Questions available: {sum(1 for q in QUESTIONS if q['concept_id'] == w['concept']['id'])}"],
        })

    return recs


ALIASES = {
    "oop": "oop_basics", "class": "oop_basics", "classes": "oop_basics", "loop": "control_flow", "loops": "control_flow",
    "dict": "dicts_sets", "dictionary": "dicts_sets", "list": "lists_tuples", "tuple": "lists_tuples",
    "error": "exceptions", "errors": "exceptions", "try": "exceptions", "file": "file_handling", "files": "file_handling",
    "generator": "iterators_generators", "yield": "iterators_generators", "inherit": "oop_advanced", "inheritance": "oop_advanced",
    "stack": "data_structures_py", "queue": "data_structures_py", "sort": "algorithms_py", "sorting": "algorithms_py",
    "search": "algorithms_py", "pip": "libraries_ecosystem", "venv": "libraries_ecosystem", "pytest": "testing_py",
    "test": "testing_py", "decorator": "decorators",
}


def find_concept_for_message(msg):
    m = msg.lower()
    for c in CONCEPTS:
        words = [w for w in c["name"].lower().replace("&", " ").replace("/", " ").split() if len(w) > 3]
        if c["name"].lower() in m or any(w in m for w in words):
            return c
    for key, cid in ALIASES.items():
        if key in m:
            return CONCEPT_MAP[cid]
    return None


def tutor_respond(msg, k):
    concept = find_concept_for_message(msg)
    if not concept:
        return {
            "text": "I can explain any topic on the Python roadmap — things like syntax, functions, OOP basics, "
                    "exceptions, decorators, or algorithms. Try asking \u201cwhat is a decorator?\u201d",
            "concept_id": None, "level_label": None, "example": None,
        }
    content = TUTOR_CONTENT[concept["id"]]
    mastery = k.get(concept["id"], {}).get("mastery", 0)
    if mastery >= 70:
        level_label, text = "Advanced", content["adv"]
    elif mastery >= 40:
        level_label, text = "Intermediate", f"{content['beg']} {content['adv']}"
    else:
        level_label, text = "Beginner", content["beg"]
    return {"text": text, "concept_id": concept["id"], "level_label": level_label, "example": content["ex"]}
