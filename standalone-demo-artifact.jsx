import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LayoutDashboard, GitBranch, Terminal, ListChecks, Briefcase, Map as MapIcon,
  Flame, Target, TrendingUp, AlertTriangle, Search, Sparkles, RotateCcw, Send,
  CheckCircle2, XCircle, Lock, ChevronRight, ChevronDown, Award, Code2, X, Info
} from "lucide-react";

/* ======================================================================
   EduNexus AI — Python Track
   Self-contained interactive demo. All "AI" here is deterministic mock
   logic over a real knowledge graph, not a live model — but every
   button performs a real computation against real state.
   ====================================================================== */

/* ---------------------------- CURRICULUM DAG --------------------------- */

const CONCEPTS = [
  { id: "syntax_basics", name: "Python Syntax & Variables", level: 0, diff: 1, prereqs: [], blurb: "Statements, variables, indentation, and print()." },
  { id: "data_types", name: "Data Types", level: 1, diff: 1, prereqs: ["syntax_basics"], blurb: "int, float, str, bool and how Python treats each." },
  { id: "operators", name: "Operators & Expressions", level: 1, diff: 1, prereqs: ["syntax_basics"], blurb: "Arithmetic, comparison, logical, assignment operators." },
  { id: "control_flow", name: "Control Flow", level: 2, diff: 2, prereqs: ["operators"], blurb: "if / elif / else branching and for / while loops." },
  { id: "strings", name: "String Manipulation", level: 2, diff: 2, prereqs: ["data_types"], blurb: "Slicing, formatting, and common string methods." },
  { id: "lists_tuples", name: "Lists & Tuples", level: 2, diff: 2, prereqs: ["data_types"], blurb: "Ordered collections — mutable lists vs immutable tuples." },
  { id: "functions", name: "Functions", level: 3, diff: 2, prereqs: ["control_flow"], blurb: "def, parameters, return values, and scope." },
  { id: "dicts_sets", name: "Dictionaries & Sets", level: 3, diff: 2, prereqs: ["lists_tuples"], blurb: "Key-value mappings and unique unordered collections." },
  { id: "comprehensions", name: "Comprehensions", level: 4, diff: 3, prereqs: ["lists_tuples", "functions"], blurb: "Concise list / dict / set construction in one expression." },
  { id: "exceptions", name: "Exception Handling", level: 4, diff: 3, prereqs: ["functions"], blurb: "try / except / finally and raising your own errors." },
  { id: "modules_packages", name: "Modules & Packages", level: 4, diff: 2, prereqs: ["functions"], blurb: "Organizing code with import, packages, __init__.py." },
  { id: "oop_basics", name: "OOP Basics", level: 4, diff: 3, prereqs: ["functions", "dicts_sets"], blurb: "Classes, objects, __init__, and self." },
  { id: "file_handling", name: "File Handling", level: 5, diff: 3, prereqs: ["exceptions"], blurb: "Reading and writing files safely with context managers." },
  { id: "iterators_generators", name: "Iterators & Generators", level: 5, diff: 4, prereqs: ["comprehensions"], blurb: "Lazy evaluation with yield and the iterator protocol." },
  { id: "oop_advanced", name: "Inheritance & Polymorphism", level: 5, diff: 4, prereqs: ["oop_basics"], blurb: "Subclassing, method overriding, multiple inheritance." },
  { id: "data_structures_py", name: "Data Structures in Python", level: 5, diff: 4, prereqs: ["oop_basics", "lists_tuples"], blurb: "Implementing stacks, queues, and trees from scratch." },
  { id: "testing_py", name: "Testing with pytest", level: 5, diff: 3, prereqs: ["functions", "exceptions"], blurb: "Writing asserts and tests that catch regressions." },
  { id: "libraries_ecosystem", name: "Libraries & Environments", level: 5, diff: 3, prereqs: ["modules_packages"], blurb: "pip, virtual environments, and third-party libraries." },
  { id: "decorators", name: "Decorators", level: 6, diff: 4, prereqs: ["functions", "iterators_generators"], blurb: "Wrapping functions to extend behaviour with @syntax." },
  { id: "algorithms_py", name: "Algorithms in Python", level: 6, diff: 4, prereqs: ["data_structures_py", "control_flow"], blurb: "Sorting, searching, and complexity analysis in practice." },
];
const CONCEPT_MAP = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
const MAX_LEVEL = Math.max(...CONCEPTS.map((c) => c.level));

function ancestorClosure(ids) {
  const seen = new Set();
  const stack = [...ids];
  while (stack.length) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    const c = CONCEPT_MAP[id];
    if (c) c.prereqs.forEach((p) => stack.push(p));
  }
  return seen;
}
function descendants(id) {
  return CONCEPTS.filter((c) => c.prereqs.includes(id)).map((c) => c.id);
}

/* ------------------------------- CAREERS -------------------------------- */

const CAREERS = [
  { id: "automation_engineer", name: "Python Automation Engineer", blurb: "Scripts and tools that eliminate repetitive manual work.",
    weights: { functions: 1, file_handling: 1, exceptions: 1, modules_packages: 0.7, libraries_ecosystem: 1, control_flow: 0.5 } },
  { id: "backend_developer", name: "Python Backend Developer", blurb: "Server-side logic, APIs, and application architecture.",
    weights: { functions: 1, oop_basics: 1, oop_advanced: 0.8, exceptions: 0.7, modules_packages: 0.7, testing_py: 0.8, libraries_ecosystem: 0.6 } },
  { id: "data_analyst", name: "Python Data Analyst", blurb: "Turning raw data into insight with Python's data tooling.",
    weights: { data_types: 0.6, lists_tuples: 0.8, dicts_sets: 0.8, comprehensions: 0.7, strings: 0.6, libraries_ecosystem: 1 } },
  { id: "software_engineer", name: "Python Software Engineer — DSA Track", blurb: "Strong fundamentals in data structures and algorithms.",
    weights: { control_flow: 0.6, functions: 0.8, data_structures_py: 1, algorithms_py: 1, oop_basics: 0.7, oop_advanced: 0.6 } },
  { id: "qa_engineer", name: "Python QA / Test Automation Engineer", blurb: "Building automated test suites and quality pipelines.",
    weights: { functions: 0.8, exceptions: 0.8, testing_py: 1, file_handling: 0.6, modules_packages: 0.5, libraries_ecosystem: 0.7 } },
];
const CAREER_MAP = Object.fromEntries(CAREERS.map((c) => [c.id, c]));

/* ------------------------------ PROJECTS -------------------------------- */

const PROJECTS = [
  { id: "contact_cli", title: "Contact Book CLI", concepts: ["oop_basics", "file_handling", "dicts_sets"], blurb: "A command-line contact manager that saves and loads entries from a file.", tech: ["Python", "JSON"] },
  { id: "word_freq", title: "Word Frequency Analyzer", concepts: ["dicts_sets", "strings", "lists_tuples"], blurb: "Parse a text file and rank its most common words.", tech: ["Python", "collections"] },
  { id: "weather_cli", title: "Weather Lookup CLI", concepts: ["libraries_ecosystem", "exceptions", "functions"], blurb: "Fetch live weather for a city from a public API.", tech: ["Python", "requests"] },
  { id: "ds_library", title: "Custom Data Structure Library", concepts: ["data_structures_py", "algorithms_py", "oop_advanced"], blurb: "Implement your own stack, queue and BST, each with tests.", tech: ["Python", "pytest"] },
  { id: "calc_tests", title: "Tested Calculator Module", concepts: ["testing_py", "functions", "exceptions"], blurb: "Build a calculator module with a full pytest suite covering edge cases.", tech: ["Python", "pytest"] },
];

/* ------------------------------ QUESTIONS -------------------------------- */

const QUESTIONS = [
  { id: "q1", conceptId: "syntax_basics", diff: 1, q: "Which symbol starts a single-line comment in Python?", opts: ["//", "#", "<!--", "/*"], correct: 1, exp: "Python uses # for single-line comments." },
  { id: "q2", conceptId: "syntax_basics", diff: 1, q: "What does print(type(5)) output?", opts: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'number'>"], correct: 0, exp: "5 is a plain integer literal, so type(5) is int." },
  { id: "q3", conceptId: "data_types", diff: 1, q: "Which of these is an immutable data type?", opts: ["list", "dict", "tuple", "set"], correct: 2, exp: "Tuples cannot be modified after creation." },
  { id: "q4", conceptId: "data_types", diff: 1, q: "What is the type of the value True?", opts: ["int", "bool", "str", "float"], correct: 1, exp: "True/False are of type bool (a subclass of int)." },
  { id: "q5", conceptId: "operators", diff: 1, q: "What does the // operator do?", opts: ["Float division", "Floor division", "Modulus", "Exponent"], correct: 1, exp: "// performs floor (integer) division." },
  { id: "q6", conceptId: "operators", diff: 1, q: "What is 3 ** 2?", opts: ["6", "9", "5", "1"], correct: 1, exp: "** is exponentiation, so 3**2 = 9." },
  { id: "q7", conceptId: "control_flow", diff: 2, q: "Which line starts an intentional infinite loop?", opts: ["while True:", "loop:", "repeat:", "for ever:"], correct: 0, exp: "while True: loops until an explicit break." },
  { id: "q8", conceptId: "control_flow", diff: 2, q: "What does 'continue' do inside a loop?", opts: ["Exits the loop", "Skips to the next iteration", "Pauses execution", "Restarts the program"], correct: 1, exp: "continue skips the rest of the current iteration." },
  { id: "q9", conceptId: "strings", diff: 2, q: 'What does "Hello"[1:4] return?', opts: ["Hell", "ell", "ello", "Hel"], correct: 1, exp: "Slicing [1:4] takes indices 1,2,3 → 'ell'." },
  { id: "q10", conceptId: "strings", diff: 2, q: "Which method converts a string to uppercase?", opts: [".upper()", ".toUpper()", ".capitalize()", ".upperCase()"], correct: 0, exp: "Strings expose .upper() for uppercasing." },
  { id: "q11", conceptId: "lists_tuples", diff: 2, q: "Which literal creates an empty tuple?", opts: ["[]", "{}", "()", "(,)"], correct: 2, exp: "() is an empty tuple; {} is an empty dict." },
  { id: "q12", conceptId: "lists_tuples", diff: 2, q: "What does list.append(x) do?", opts: ["Inserts x at the start", "Removes x", "Adds x to the end", "Sorts the list"], correct: 2, exp: "append() adds a single element to the end of the list." },
  { id: "q13", conceptId: "functions", diff: 2, q: "What keyword defines a function?", opts: ["func", "def", "function", "lambda"], correct: 1, exp: "def introduces a function definition." },
  { id: "q14", conceptId: "functions", diff: 2, q: "What does a function return if it has no return statement?", opts: ["0", "None", "An error", "Empty string"], correct: 1, exp: "Functions implicitly return None." },
  { id: "q15", conceptId: "dicts_sets", diff: 2, q: "How do you access value for key k in dict d?", opts: ["d.k", "d[k]", "d(k)", "d->k"], correct: 1, exp: "Square-bracket indexing looks up a key in a dict." },
  { id: "q16", conceptId: "dicts_sets", diff: 2, q: "Which structure holds unique, unordered elements?", opts: ["list", "tuple", "set", "string"], correct: 2, exp: "A set automatically discards duplicates." },
  { id: "q17", conceptId: "comprehensions", diff: 3, q: "What does [x*2 for x in range(3)] evaluate to?", opts: ["[0,2,4]", "[0,1,2]", "[2,4,6]", "[1,2,3]"], correct: 0, exp: "range(3) → 0,1,2, doubled → 0,2,4." },
  { id: "q18", conceptId: "comprehensions", diff: 3, q: "List comprehensions are mainly used to:", opts: ["Define classes", "Build lists concisely", "Handle exceptions", "Open files"], correct: 1, exp: "They're a compact syntax for building lists." },
  { id: "q19", conceptId: "exceptions", diff: 3, q: "Which block always executes, error or not?", opts: ["try", "except", "finally", "raise"], correct: 2, exp: "finally runs regardless of whether an exception occurred." },
  { id: "q20", conceptId: "exceptions", diff: 3, q: "Which keyword manually raises an exception?", opts: ["throw", "raise", "error", "except"], correct: 1, exp: "Python uses raise, not throw." },
  { id: "q21", conceptId: "modules_packages", diff: 2, q: "Which statement imports the math module?", opts: ["#include math", "import math", "using math", "require('math')"], correct: 1, exp: "import math is the standard form." },
  { id: "q22", conceptId: "modules_packages", diff: 2, q: "A directory becomes a package (classic style) if it contains a:", opts: ["main.py", "__init__.py", "package.json", "setup.cfg"], correct: 1, exp: "__init__.py historically marks a package." },
  { id: "q23", conceptId: "oop_basics", diff: 3, q: "What keyword defines a class?", opts: ["class", "struct", "object", "def"], correct: 0, exp: "class starts a class definition." },
  { id: "q24", conceptId: "oop_basics", diff: 3, q: "What does 'self' refer to in a method?", opts: ["The class itself", "The current instance", "Nothing, it's unused", "The parent module"], correct: 1, exp: "self is the conventional name for the instance." },
  { id: "q25", conceptId: "file_handling", diff: 3, q: "Which mode opens a file for appending?", opts: ["'r'", "'w'", "'a'", "'x'"], correct: 2, exp: "'a' opens for append, writing past existing content." },
  { id: "q26", conceptId: "file_handling", diff: 3, q: "What's the recommended way to open a file so it auto-closes?", opts: ["open() alone", "with open() as f:", "file.open()", "try/open"], correct: 1, exp: "The with statement closes the file automatically." },
  { id: "q27", conceptId: "iterators_generators", diff: 4, q: "Which keyword creates a generator function?", opts: ["return", "yield", "gen", "iter"], correct: 1, exp: "yield turns a function into a generator." },
  { id: "q28", conceptId: "iterators_generators", diff: 4, q: "Which method must an iterator implement to produce values?", opts: ["__next__", "__iter__ only", "__gen__", "__loop__"], correct: 0, exp: "__next__ returns the next value or raises StopIteration." },
  { id: "q29", conceptId: "oop_advanced", diff: 4, q: "Providing a new implementation of a parent's method is called:", opts: ["Encapsulation", "Overriding", "Overloading", "Abstraction"], correct: 1, exp: "Method overriding replaces the inherited behaviour." },
  { id: "q30", conceptId: "oop_advanced", diff: 4, q: "Python supports multiple inheritance by:", opts: ["Not at all", "Listing multiple base classes", "Interfaces only", "Mixins exclusively"], correct: 1, exp: "class C(A, B): lists multiple bases directly." },
  { id: "q31", conceptId: "data_structures_py", diff: 4, q: "Which structure is LIFO (Last In, First Out)?", opts: ["Queue", "Stack", "Tree", "Graph"], correct: 1, exp: "A stack pops the most recently pushed item first." },
  { id: "q32", conceptId: "data_structures_py", diff: 4, q: "A Python list can directly serve as a:", opts: ["Only a queue", "Only a stack", "Stack or queue (with trade-offs)", "Neither"], correct: 2, exp: "Lists support both, though deque is more efficient for queues." },
  { id: "q33", conceptId: "testing_py", diff: 3, q: "Which library is most commonly used for writing tests in Python?", opts: ["pytest", "numpy", "flask", "requests"], correct: 0, exp: "pytest is the de-facto standard testing framework." },
  { id: "q34", conceptId: "testing_py", diff: 3, q: "What is the purpose of an assert statement in a test?", opts: ["Print output", "Verify a condition is true", "Import a module", "Handle exceptions"], correct: 1, exp: "assert fails the test if the condition is false." },
  { id: "q35", conceptId: "libraries_ecosystem", diff: 3, q: "Which command installs a third-party package?", opts: ["python install pkg", "pip install pkg", "get pkg", "import pkg"], correct: 1, exp: "pip is Python's package installer." },
  { id: "q36", conceptId: "libraries_ecosystem", diff: 3, q: "What is a virtual environment used for?", opts: ["Running Python faster", "Isolating project dependencies", "Compiling code", "Debugging syntax"], correct: 1, exp: "venvs keep each project's dependencies separate." },
  { id: "q37", conceptId: "decorators", diff: 4, q: "What symbol applies a decorator to a function?", opts: ["#", "@", "&", "::"], correct: 1, exp: "@decorator_name goes just above the function definition." },
  { id: "q38", conceptId: "decorators", diff: 4, q: "A decorator is essentially a function that:", opts: ["Deletes another function", "Wraps and extends another function", "Only works on classes", "Replaces Python syntax"], correct: 1, exp: "Decorators take a function and return an enhanced version." },
  { id: "q39", conceptId: "algorithms_py", diff: 4, q: "What is the average time complexity of binary search?", opts: ["O(n)", "O(log n)", "O(n^2)", "O(1)"], correct: 1, exp: "Binary search halves the search space each step." },
  { id: "q40", conceptId: "algorithms_py", diff: 4, q: "Which sort repeatedly swaps adjacent out-of-order elements?", opts: ["Merge sort", "Bubble sort", "Quick sort", "Binary search"], correct: 1, exp: "Bubble sort's defining move is adjacent swaps." },
];

/* --------------------------------- TUTOR --------------------------------- */

const TUTOR_CONTENT = {
  syntax_basics: { beg: "Python reads top to bottom. Indentation (not braces) defines blocks, so consistent spacing isn't a style choice — it's syntax.", adv: "Indentation is enforced by the tokenizer via INDENT/DEDENT tokens, which is why mixing tabs and spaces raises a TabError.", ex: "name = \"Ada\"\nprint(f\"Hello, {name}\")" },
  data_types: { beg: "Every value has a type — int, float, str, bool — and Python figures it out automatically, no declarations needed.", adv: "Python is dynamically but strongly typed: variables are just names bound to objects, and implicit coercion is intentionally limited.", ex: "x = 7          # int\ny = 3.5        # float\nname = \"Rex\"   # str" },
  operators: { beg: "Operators combine values: + - * / for math, == != < > for comparisons, and and/or/not for logic.", adv: "Comparison operators can be chained (1 < x < 10), and operators like + are resolved via dunder methods (__add__) on the operands.", ex: "print(10 % 3)   # 1\nprint(2 ** 10)  # 1024" },
  control_flow: { beg: "if/elif/else picks a branch to run, and for/while loops repeat code while a condition holds.", adv: "for loops iterate over any iterable via the iterator protocol; while loops pair well with sentinel or state-machine style conditions.", ex: "for i in range(3):\n    if i == 1:\n        print(\"one\")" },
  strings: { beg: "Strings are sequences of characters — slice them with [start:end], and use f-strings to build new ones.", adv: "Strings are immutable; every 'modification' method returns a new object, which matters for performance in tight loops.", ex: "s = \"python\"\nprint(s[:3], s.upper())" },
  lists_tuples: { beg: "Lists are ordered and changeable ([1,2,3]); tuples are ordered but frozen once created ((1,2,3)).", adv: "Tuples' immutability makes them hashable when their contents are hashable, so they can be dict keys — lists never can.", ex: "nums = [3, 1, 2]\nnums.sort()\npoint = (10, 20)" },
  functions: { beg: "def name(params): defines reusable code. Arguments come in, a value optionally comes out via return.", adv: "Python supports default args, *args/**kwargs, and closures — functions are first-class objects you can pass around.", ex: "def add(a, b=0):\n    return a + b" },
  dicts_sets: { beg: "Dicts store key → value pairs; sets store unique values with no order guarantee (in the conceptual sense).", adv: "Both are hash-table backed, giving average O(1) lookup — but keys/set members must be hashable (so immutable-ish).", ex: "ages = {\"Ada\": 30}\nunique = {1, 2, 2, 3}" },
  comprehensions: { beg: "A comprehension builds a collection in one line: [expr for item in iterable if condition].", adv: "Comprehensions create their own scope in Python 3 and are typically faster than an equivalent for-loop + append due to fewer bytecode ops.", ex: "evens = [x for x in range(10) if x % 2 == 0]" },
  exceptions: { beg: "Wrap risky code in try:, catch problems in except:, and finally: always runs to clean up.", adv: "Prefer catching specific exception types over bare except:, and use custom exception classes to carry structured error context.", ex: "try:\n    1 / 0\nexcept ZeroDivisionError as e:\n    print(e)" },
  modules_packages: { beg: "import brings code from another file into yours. A folder of modules becomes a package.", adv: "Python resolves imports via sys.path; relative imports (from . import x) only work correctly inside a real package.", ex: "import math\nfrom math import sqrt" },
  oop_basics: { beg: "A class is a blueprint; objects are instances of it. self refers to 'this particular object'.", adv: "__init__ is the initializer (not a constructor — __new__ is), and attributes live in the instance's __dict__ by default.", ex: "class Dog:\n    def __init__(self, name):\n        self.name = name" },
  file_handling: { beg: "Use with open(path) as f: to read or write files — it closes the file automatically, even on errors.", adv: "Always specify encoding explicitly (encoding='utf-8') to avoid platform-dependent default-encoding bugs.", ex: "with open(\"notes.txt\") as f:\n    text = f.read()" },
  iterators_generators: { beg: "A generator uses yield to produce values one at a time, instead of building a whole list in memory.", adv: "Generators implement the iterator protocol lazily; they're ideal for streaming large or infinite sequences with constant memory.", ex: "def countdown(n):\n    while n > 0:\n        yield n\n        n -= 1" },
  oop_advanced: { beg: "A subclass inherits from a parent class and can override its methods to specialize behaviour.", adv: "Python's MRO (C3 linearization) determines method lookup order under multiple inheritance — check it with Cls.__mro__.", ex: "class Animal:\n    def speak(self): return \"...\"\nclass Dog(Animal):\n    def speak(self): return \"Woof\"" },
  data_structures_py: { beg: "You can build a stack or queue with a plain list, and a tree with linked node objects that reference children.", adv: "collections.deque gives O(1) appends/pops from both ends, making it a better queue than list.pop(0) which is O(n).", ex: "from collections import deque\nq = deque()\nq.append(1); q.popleft()" },
  testing_py: { beg: "pytest lets you write plain functions with assert statements — pytest finds and runs them automatically.", adv: "Use fixtures for setup/teardown and parametrize to run one test against many inputs without duplicating code.", ex: "def test_add():\n    assert 2 + 2 == 4" },
  libraries_ecosystem: { beg: "pip install <package> adds third-party code; a virtual environment keeps each project's packages separate.", adv: "Pin exact versions in requirements.txt (or use a lockfile) so environments are reproducible across machines.", ex: "python -m venv .venv\npip install requests" },
  decorators: { beg: "A decorator wraps a function to add behaviour, using @decorator syntax right above the def.", adv: "Well-written decorators use functools.wraps to preserve the wrapped function's __name__ and docstring for introspection.", ex: "def logged(fn):\n    def wrapper(*a, **k):\n        print(\"calling\", fn.__name__)\n        return fn(*a, **k)\n    return wrapper" },
  algorithms_py: { beg: "Sorting and searching are the classics — know at least one O(n log n) sort and binary search cold.", adv: "Reason about complexity in terms of input growth; Python's built-in sorted() is Timsort, O(n log n) worst case and stable.", ex: "def binary_search(arr, target):\n    lo, hi = 0, len(arr) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if arr[mid] == target: return mid\n        if arr[mid] < target: lo = mid + 1\n        else: hi = mid - 1\n    return -1" },
};

/* ------------------------------- HELPERS -------------------------------- */

function daysAgoISO(d) { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString(); }
function daysSince(iso) { if (!iso) return null; return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function bucket(mastery) {
  if (mastery == null || mastery <= 0) return "unstarted";
  if (mastery < 45) return "weak";
  if (mastery < 75) return "developing";
  return "strong";
}
const BUCKET_COLOR = { unstarted: "var(--comment)", weak: "var(--error)", developing: "var(--function)", strong: "var(--string)" };
const BUCKET_LABEL = { unstarted: "Not started", weak: "Weak", developing: "Developing", strong: "Strong" };

function seedKnowledge() {
  const raw = {
    syntax_basics: [92, 2], data_types: [88, 3], operators: [85, 5], control_flow: [79, 4],
    strings: [74, 6], lists_tuples: [81, 3], dicts_sets: [63, 25], functions: [70, 7],
    comprehensions: [45, 10], exceptions: [38, 12], modules_packages: [55, 20], oop_basics: [42, 9],
    file_handling: [20, 15], iterators_generators: [15, 16], oop_advanced: [10, 18],
    data_structures_py: [25, 14], testing_py: [30, 11], libraries_ecosystem: [48, 18],
    decorators: [0, null], algorithms_py: [18, 19],
  };
  const out = {};
  Object.entries(raw).forEach(([id, [mastery, days]]) => {
    out[id] = { mastery, lastStudied: days == null ? null : daysAgoISO(days), attempts: days == null ? 0 : 2 };
  });
  return out;
}
function seedState() {
  return {
    studentName: "Demo Student",
    knowledge: seedKnowledge(),
    quizHistory: [],
    chatHistory: [{ role: "assistant", text: "Hi, I'm Nexus Tutor. Ask me about any Python concept — try \u201cexplain decorators\u201d, or tap a topic chip below." }],
    careerGoal: null,
    streak: 12,
    xp: 1840,
  };
}

function knowledgeScore(knowledge) {
  const vals = CONCEPTS.map((c) => knowledge[c.id]?.mastery || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
const CORE_READINESS_IDS = ["functions", "control_flow", "oop_basics", "exceptions", "data_structures_py", "algorithms_py", "testing_py"];
function readinessScore(knowledge) {
  const vals = CORE_READINESS_IDS.map((id) => knowledge[id]?.mastery || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
function careerMatch(careerId, knowledge) {
  const w = CAREER_MAP[careerId].weights;
  let num = 0, den = 0;
  Object.entries(w).forEach(([id, weight]) => {
    num += (knowledge[id]?.mastery || 0) * weight;
    den += weight * 100;
  });
  return Math.round((num / den) * 100);
}
function allCareerMatches(knowledge) {
  return CAREERS.map((c) => ({ career: c, score: careerMatch(c.id, knowledge) })).sort((a, b) => b.score - a.score);
}
function careerGaps(careerId, knowledge) {
  const w = CAREER_MAP[careerId].weights;
  return Object.entries(w)
    .map(([id, weight]) => ({ concept: CONCEPT_MAP[id], weight, mastery: knowledge[id]?.mastery || 0, gap: 100 - (knowledge[id]?.mastery || 0) }))
    .sort((a, b) => (b.weight - a.weight) || (a.mastery - b.mastery));
}
function decayAlerts(knowledge) {
  return CONCEPTS.map((c) => {
    const k = knowledge[c.id];
    const d = daysSince(k?.lastStudied);
    return { concept: c, mastery: k?.mastery || 0, days: d };
  })
    .filter((x) => x.mastery > 0 && x.days != null && x.days >= 14)
    .sort((a, b) => b.days - a.days)
    .map((x) => ({ ...x, reviewMinutes: clamp(Math.round(x.days / 2), 10, 40) }));
}
function bestProjects(knowledge, n = 3) {
  return PROJECTS.map((p) => {
    const avg = p.concepts.reduce((s, id) => s + (knowledge[id]?.mastery || 0), 0) / p.concepts.length;
    return { project: p, readiness: Math.round(avg) };
  }).sort((a, b) => b.readiness - a.readiness).slice(0, n);
}
function roadmapFor(careerId, knowledge) {
  if (!careerId) return [];
  const required = Object.keys(CAREER_MAP[careerId].weights);
  const closure = [...ancestorClosure(required)];
  const weak = closure
    .map((id) => CONCEPT_MAP[id])
    .filter((c) => (knowledge[c.id]?.mastery || 0) < 75)
    .sort((a, b) => (a.level - b.level) || (a.diff - b.diff));
  const months = [];
  for (let i = 0; i < weak.length; i += 3) {
    months.push({ month: months.length + 1, concepts: weak.slice(i, i + 3) });
  }
  months.push({ month: months.length + 1, concepts: [{ id: "_project", name: "Capstone Project", level: 99, diff: 0, prereqs: [], blurb: "Apply everything in a portfolio project.", isProject: true }] });
  return months;
}
function recommendations(state) {
  const { knowledge, careerGoal } = state;
  const recs = [];

  // Learn: weakest prereq relevant to career goal (or globally weakest studied concept)
  let learnTarget = null;
  if (careerGoal) {
    const gaps = careerGaps(careerGoal, knowledge);
    learnTarget = gaps.find((g) => g.mastery < 60);
  }
  if (!learnTarget) {
    const started = CONCEPTS.map((c) => ({ concept: c, mastery: knowledge[c.id]?.mastery || 0 })).filter((x) => x.mastery > 0);
    started.sort((a, b) => a.mastery - b.mastery);
    if (started[0]) learnTarget = { concept: started[0].concept, mastery: started[0].mastery, weight: 1 };
  }
  if (learnTarget) {
    recs.push({
      type: "learn", icon: "🎯", title: `Revise ${learnTarget.concept.name}`,
      text: `Your mastery here is ${learnTarget.mastery}%${careerGoal ? `, and it's important for ${CAREER_MAP[careerGoal].name}` : ""}.`,
      factors: [`Current mastery: ${learnTarget.mastery}%`, careerGoal ? `Relevance to goal: ${learnTarget.weight >= 0.8 ? "High" : "Medium"}` : "Relevance: your weakest active topic", `Prerequisite for: ${descendants(learnTarget.concept.id).map((id) => CONCEPT_MAP[id].name).join(", ") || "—"}`],
    });
  }

  // Revision: decay alert
  const decay = decayAlerts(knowledge)[0];
  if (decay) {
    recs.push({
      type: "revision", icon: "🧠", title: `${decay.concept.name} knowledge is fading`,
      text: `Last studied ${decay.days} days ago. A ${decay.reviewMinutes}-minute review should restore it.`,
      factors: [`Mastery: ${decay.mastery}%`, `Last studied: ${decay.days} days ago`, `Recommended review: ${decay.reviewMinutes} minutes`],
    });
  }

  // Career
  const matches = allCareerMatches(knowledge);
  const top = matches[0];
  if (top) {
    recs.push({
      type: "career", icon: "💼", title: `You're ${top.score}% matched to ${top.career.name}`,
      text: careerGoal === top.career.id ? "This is your current goal — keep closing the gaps below." : "Consider setting this as your career goal on the Career AI tab.",
      factors: [`Match score: ${top.score}%`, `Based on ${Object.keys(top.career.weights).length} weighted concepts`, `Next best match: ${matches[1] ? `${matches[1].career.name} (${matches[1].score}%)` : "—"}`],
    });
  }

  // Project
  const proj = bestProjects(knowledge, 1)[0];
  if (proj) {
    recs.push({
      type: "project", icon: "🚀", title: `Build: ${proj.project.title}`,
      text: proj.project.blurb,
      factors: [`Skill readiness: ${proj.readiness}%`, `Concepts used: ${proj.project.concepts.map((id) => CONCEPT_MAP[id].name).join(", ")}`, `Tech: ${proj.project.tech.join(", ")}`],
    });
  }

  // Quiz
  const weakStarted = CONCEPTS.map((c) => ({ concept: c, mastery: knowledge[c.id]?.mastery || 0 })).filter((x) => x.mastery > 0 && x.mastery < 65).sort((a, b) => a.mastery - b.mastery)[0];
  if (weakStarted) {
    recs.push({
      type: "quiz", icon: "🎤", title: `Practice quiz: ${weakStarted.concept.name}`,
      text: `A short quiz here will sharpen a concept sitting at ${weakStarted.mastery}% mastery.`,
      factors: [`Current mastery: ${weakStarted.mastery}%`, `Questions available: ${QUESTIONS.filter((q) => q.conceptId === weakStarted.concept.id).length}`],
    });
  }

  return recs;
}

/* --------------------------------- TUTOR ENGINE --------------------------------- */

function findConceptForMessage(msg) {
  const m = msg.toLowerCase();
  let best = null;
  for (const c of CONCEPTS) {
    const words = c.name.toLowerCase().split(/[\s&/]+/).filter((w) => w.length > 3);
    if (m.includes(c.name.toLowerCase()) || words.some((w) => m.includes(w))) { best = c; break; }
  }
  if (!best) {
    const alias = { oop: "oop_basics", class: "oop_basics", classes: "oop_basics", loop: "control_flow", loops: "control_flow", dict: "dicts_sets", dictionary: "dicts_sets", list: "lists_tuples", tuple: "lists_tuples", error: "exceptions", errors: "exceptions", try: "exceptions", file: "file_handling", files: "file_handling", generator: "iterators_generators", yield: "iterators_generators", inherit: "oop_advanced", inheritance: "oop_advanced", stack: "data_structures_py", queue: "data_structures_py", sort: "algorithms_py", sorting: "algorithms_py", search: "algorithms_py", pip: "libraries_ecosystem", venv: "libraries_ecosystem", pytest: "testing_py", test: "testing_py", decorator: "decorators", "@": "decorators" };
    for (const key of Object.keys(alias)) if (m.includes(key)) { best = CONCEPT_MAP[alias[key]]; break; }
  }
  return best;
}
function tutorRespond(msg, knowledge) {
  const concept = findConceptForMessage(msg);
  if (!concept) {
    return "I can explain any topic on the Python roadmap — things like syntax, functions, OOP basics, exceptions, decorators, or algorithms. Try asking \u201cwhat is a decorator?\u201d or tap a chip below.";
  }
  const content = TUTOR_CONTENT[concept.id];
  const mastery = knowledge[concept.id]?.mastery || 0;
  const level = mastery >= 70 ? "adv" : "beg";
  const levelLabel = mastery >= 70 ? "Advanced" : mastery >= 40 ? "Intermediate" : "Beginner";
  const explanation = mastery >= 40 && mastery < 70 ? `${content.beg} ${content.adv}` : content[level];
  return { concept, levelLabel, text: explanation, example: content.ex };
}

/* --------------------------------- UI PRIMITIVES --------------------------------- */

function ProgressBar({ value, colorVar = "var(--keyword)", height = 8 }) {
  return (
    <div style={{ height, background: "var(--bg-inset)", borderRadius: 999, overflow: "hidden", border: "1px solid var(--border)" }}>
      <div style={{ width: `${clamp(value, 0, 100)}%`, height: "100%", background: colorVar, transition: "width .5s ease" }} />
    </div>
  );
}
function MasteryPill({ mastery }) {
  const b = bucket(mastery);
  return (
    <span className="mono" style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `color-mix(in srgb, ${BUCKET_COLOR[b]} 18%, transparent)`, color: BUCKET_COLOR[b], border: `1px solid color-mix(in srgb, ${BUCKET_COLOR[b]} 45%, transparent)` }}>
      {mastery}%
    </span>
  );
}
function Panel({ title, icon, right, children, style }) {
  return (
    <div className="panel" style={style}>
      {(title || right) && (
        <div className="panel-head">
          <div className="panel-title">{icon}{title}</div>
          {right}
        </div>
      )}
      <div className="panel-body">{children}</div>
    </div>
  );
}
function Explain({ factors }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button className="link-btn" onClick={() => setOpen((o) => !o)}>
        <Info size={12} /> Why am I seeing this? {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <ul className="explain-list mono">
          {factors.map((f, i) => <li key={i}>{f}</li>)}
        </ul>
      )}
    </div>
  );
}

/* --------------------------------- DASHBOARD --------------------------------- */

function Dashboard({ state, setTab, setCareerGoalTab, setQuizPreset, setGraphSelect }) {
  const { knowledge, careerGoal, streak, xp } = state;
  const kScore = knowledgeScore(knowledge);
  const readiness = readinessScore(knowledge);
  const matches = allCareerMatches(knowledge);
  const topMatch = matches[0];
  const decay = decayAlerts(knowledge);
  const recs = recommendations(state);
  const roadmap = careerGoal ? roadmapFor(careerGoal, knowledge) : [];
  const todaysPlan = roadmap[0]?.concepts?.filter((c) => !c.isProject) || CONCEPTS.filter((c) => (knowledge[c.id]?.mastery || 0) > 0 && (knowledge[c.id]?.mastery || 0) < 60).slice(0, 3);

  return (
    <div className="stack-lg">
      <div>
        <h1 className="display">Welcome back, {state.studentName} 👋</h1>
        <p className="dim mono" style={{ marginTop: 4 }}>{"# your Python knowledge state, computed live"}</p>
      </div>

      <div className="grid-4">
        <Panel title="Learning Streak" icon={<Flame size={16} color="var(--error)" />}>
          <div className="stat-num">{streak}<span className="stat-unit"> days</span></div>
          <div className="dim" style={{ fontSize: 13 }}>{xp.toLocaleString()} XP earned</div>
        </Panel>
        <Panel title="Knowledge Score" icon={<TrendingUp size={16} color="var(--keyword)" />}>
          <div className="stat-num">{kScore}<span className="stat-unit">%</span></div>
          <ProgressBar value={kScore} colorVar="var(--keyword)" />
        </Panel>
        <Panel title="Placement Readiness" icon={<Award size={16} color="var(--string)" />}>
          <div className="stat-num">{readiness}<span className="stat-unit">%</span></div>
          <ProgressBar value={readiness} colorVar="var(--string)" />
        </Panel>
        <Panel title="Top Career Match" icon={<Briefcase size={16} color="var(--number)" />}>
          <div className="stat-num" style={{ fontSize: 28 }}>{topMatch.score}<span className="stat-unit">%</span></div>
          <div className="dim" style={{ fontSize: 13 }}>{topMatch.career.name}</div>
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Today's Learning Plan" icon={<Target size={16} color="var(--keyword)" />}
          right={<button className="btn-ghost" onClick={() => setTab("roadmap")}>View roadmap <ChevronRight size={14} /></button>}>
          {todaysPlan.length === 0 ? (
            <div className="empty">Every core concept is in good shape. Try a harder quiz to push further.</div>
          ) : (
            <ul className="list">
              {todaysPlan.map((c) => (
                <li key={c.id} className="list-row">
                  <div>
                    <div className="row-title">{c.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{c.blurb}</div>
                  </div>
                  <MasteryPill mastery={knowledge[c.id]?.mastery || 0} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Knowledge Decay Alerts" icon={<AlertTriangle size={16} color="var(--error)" />}>
          {decay.length === 0 ? (
            <div className="empty">Nothing is decaying right now — nice consistency.</div>
          ) : (
            <ul className="list">
              {decay.slice(0, 4).map((d) => (
                <li key={d.concept.id} className="list-row">
                  <div>
                    <div className="row-title">⚠️ {d.concept.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>Last studied {d.days} days ago · {d.reviewMinutes} min review recommended</div>
                  </div>
                  <button className="btn-ghost" onClick={() => { setQuizPreset(d.concept.id); setTab("quiz"); }}>Revise</button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="AI Recommendations for You" icon={<Sparkles size={16} color="var(--number)" />}
        right={<button className="btn-ghost" onClick={() => setTab("career")}>Set career goal <ChevronRight size={14} /></button>}>
        <div className="grid-2">
          {recs.map((r, i) => (
            <div key={i} className="rec-card">
              <div className="rec-head"><span style={{ fontSize: 18 }}>{r.icon}</span><span className="row-title">{r.title}</span></div>
              <div className="dim" style={{ fontSize: 13, margin: "6px 0 8px" }}>{r.text}</div>
              <Explain factors={r.factors} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- KNOWLEDGE GRAPH --------------------------------- */

function KnowledgeGraph({ knowledge, careerGoal }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const levels = useMemo(() => {
    const arr = Array.from({ length: MAX_LEVEL + 1 }, () => []);
    CONCEPTS.forEach((c) => arr[c.level].push(c));
    return arr;
  }, []);
  const positions = useMemo(() => {
    const pos = {};
    const colW = 190, rowH = 100, padX = 90, padY = 50;
    levels.forEach((row, li) => {
      row.forEach((c, ri) => {
        pos[c.id] = { x: padX + li * colW, y: padY + ri * rowH + (6 - row.length) * (rowH / 2 * 0.35) };
      });
    });
    return pos;
  }, [levels]);
  const width = 90 + MAX_LEVEL * 190 + 170;
  const height = 50 + 6 * 100 + 60;

  const requiredForGoal = careerGoal ? new Set(ancestorClosure(Object.keys(CAREER_MAP[careerGoal].weights))) : null;
  const matchesSearch = (c) => search.trim().length > 0 && c.name.toLowerCase().includes(search.toLowerCase());

  const sel = selected ? CONCEPT_MAP[selected] : null;
  const selK = sel ? knowledge[sel.id] : null;

  return (
    <div className="stack-lg">
      <div className="graph-toolbar">
        <div className="search-box">
          <Search size={14} className="dim" />
          <input placeholder="Search concepts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="legend">
          {Object.entries(BUCKET_LABEL).map(([k, label]) => (
            <span key={k} className="legend-item"><i style={{ background: BUCKET_COLOR[k] }} />{label}</span>
          ))}
          {careerGoal && <span className="legend-item"><i style={{ background: "var(--number)", boxShadow: "0 0 0 2px var(--number)" }} />Needed for goal</span>}
        </div>
      </div>

      <div className="graph-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ minWidth: width * 0.6 }}>
          {CONCEPTS.map((c) => c.prereqs.map((p) => {
            const a = positions[p], b = positions[c.id];
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2 + 78;
            return (
              <path key={`${p}-${c.id}`}
                d={`M ${a.x + 156} ${a.y + 26} C ${midX} ${a.y + 26}, ${midX} ${b.y + 26}, ${b.x} ${b.y + 26}`}
                fill="none" stroke="var(--border)" strokeWidth="1.5" />
            );
          }))}
          {CONCEPTS.map((c) => {
            const p = positions[c.id];
            const m = knowledge[c.id]?.mastery || 0;
            const b = bucket(m);
            const isSel = selected === c.id;
            const isGoal = requiredForGoal && requiredForGoal.has(c.id);
            const isMatch = matchesSearch(c);
            return (
              <g key={c.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => setSelected(c.id)}>
                <rect width="156" height="52" rx="9"
                  fill="var(--bg-elevated)"
                  stroke={isSel ? "var(--keyword)" : isMatch ? "var(--function)" : isGoal ? "var(--number)" : "var(--border)"}
                  strokeWidth={isSel || isMatch ? 2.5 : isGoal ? 2 : 1} />
                <rect width="5" height="52" rx="2" fill={BUCKET_COLOR[b]} />
                <foreignObject x="12" y="4" width="136" height="44">
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontFamily: "Inter, sans-serif", fontSize: 11.5, lineHeight: 1.25, color: "var(--text)", overflow: "hidden" }}>
                    {c.name}
                  </div>
                </foreignObject>
                <text x="136" y="45" textAnchor="end" fontSize="10" className="mono" fill={BUCKET_COLOR[b]}>{m}%</text>
              </g>
            );
          })}
        </svg>
      </div>

      {sel && (
        <Panel title={sel.name} icon={<GitBranch size={16} color="var(--keyword)" />} right={<button className="btn-ghost" onClick={() => setSelected(null)}><X size={14} /></button>}>
          <div className="grid-2">
            <div>
              <p className="dim" style={{ fontSize: 13 }}>{sel.blurb}</p>
              <div className="stack-sm" style={{ marginTop: 10 }}>
                <div className="kv"><span>Mastery</span><MasteryPill mastery={selK?.mastery || 0} /></div>
                <div className="kv"><span>Difficulty</span><span className="mono">{"★".repeat(sel.diff)}{"☆".repeat(5 - sel.diff)}</span></div>
                <div className="kv"><span>Last studied</span><span className="mono">{selK?.lastStudied ? `${daysSince(selK.lastStudied)}d ago` : "never"}</span></div>
              </div>
            </div>
            <div>
              <div className="dim" style={{ fontSize: 12, marginBottom: 4 }}>Prerequisites</div>
              <div className="chip-row">{sel.prereqs.length ? sel.prereqs.map((p) => <span key={p} className="chip">{CONCEPT_MAP[p].name}</span>) : <span className="dim" style={{ fontSize: 12 }}>None — foundational</span>}</div>
              <div className="dim" style={{ fontSize: 12, margin: "10px 0 4px" }}>Unlocks</div>
              <div className="chip-row">{descendants(sel.id).length ? descendants(sel.id).map((d) => <span key={d} className="chip">{CONCEPT_MAP[d].name}</span>) : <span className="dim" style={{ fontSize: 12 }}>Nothing downstream yet</span>}</div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* --------------------------------- AI TUTOR --------------------------------- */

function TutorView({ knowledge, chatHistory, onSend }) {
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const chips = ["What is OOP?", "Explain decorators", "How do generators work?", "What's a list comprehension?", "Explain exception handling"];

  function submit(text) {
    const t = (text ?? input).trim();
    if (!t) return;
    onSend(t);
    setInput("");
  }

  return (
    <div className="stack-lg">
      <Panel title="Nexus Tutor" icon={<Terminal size={16} color="var(--keyword)" />} right={<span className="dim mono" style={{ fontSize: 12 }}>adapts to your mastery level</span>}>
        <div className="repl">
          {chatHistory.map((m, i) => (
            <div key={i} className="repl-line">
              {m.role === "user" ? (
                <div className="mono repl-prompt">&gt;&gt;&gt; {m.text}</div>
              ) : (
                <div className="repl-response">
                  {m.levelLabel && <span className="chip chip-accent" style={{ marginBottom: 6, display: "inline-block" }}>{m.levelLabel} explanation</span>}
                  <div>{m.text}</div>
                  {m.example && <pre className="code-block mono">{m.example}</pre>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="chip-row" style={{ margin: "10px 0" }}>
          {chips.map((c) => <button key={c} className="chip chip-btn" onClick={() => submit(c)}>{c}</button>)}
        </div>
        <div className="repl-input">
          <span className="mono">&gt;&gt;&gt;</span>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any Python concept…"
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          <button className="btn-primary" onClick={() => submit()}><Send size={14} /></button>
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- QUIZ --------------------------------- */

function QuizView({ knowledge, onComplete, preset, clearPreset }) {
  const [phase, setPhase] = useState("setup"); // setup | active | results
  const [topic, setTopic] = useState(preset || "all");
  const [difficulty, setDifficulty] = useState("all");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [picked, setPicked] = useState(null);

  useEffect(() => { if (preset) { setTopic(preset); clearPreset(); } }, [preset]);

  const available = useMemo(() => QUESTIONS.filter((q) => (topic === "all" || q.conceptId === topic) && (difficulty === "all" || q.diff === Number(difficulty))), [topic, difficulty]);
  const maxCount = Math.max(1, available.length);

  function start() {
    const pool = [...available].sort(() => Math.random() - 0.5).slice(0, Math.min(count, available.length));
    setQuestions(pool);
    setIdx(0);
    setAnswers([]);
    setPicked(null);
    setPhase("active");
  }
  function selectOpt(i) {
    if (picked != null) return;
    setPicked(i);
  }
  function next() {
    const q = questions[idx];
    const newAnswers = [...answers, { conceptId: q.conceptId, correct: picked === q.correct }];
    setAnswers(newAnswers);
    setPicked(null);
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
    } else {
      onComplete(newAnswers);
      setPhase("results");
    }
  }

  const results = useMemo(() => {
    if (phase !== "results") return null;
    const byConcept = {};
    answers.forEach((a) => {
      byConcept[a.conceptId] = byConcept[a.conceptId] || { total: 0, correct: 0 };
      byConcept[a.conceptId].total++;
      if (a.correct) byConcept[a.conceptId].correct++;
    });
    const correctCount = answers.filter((a) => a.correct).length;
    return { byConcept, correctCount, total: answers.length, accuracy: Math.round((correctCount / answers.length) * 100) };
  }, [phase, answers]);

  if (phase === "setup") {
    return (
      <Panel title="AI Quiz Generator" icon={<ListChecks size={16} color="var(--keyword)" />}>
        <div className="stack-md">
          <div className="form-row">
            <label>Topic</label>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="all">All topics (mixed)</option>
              {CONCEPTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="all">Any</option>
              <option value="1">1 — Foundational</option>
              <option value="2">2 — Core</option>
              <option value="3">3 — Applied</option>
              <option value="4">4 — Advanced</option>
            </select>
          </div>
          <div className="form-row">
            <label>Number of questions</label>
            <input type="range" min={1} max={maxCount} value={Math.min(count, maxCount)} onChange={(e) => setCount(Number(e.target.value))} />
            <span className="mono dim">{Math.min(count, maxCount)} / {maxCount} available</span>
          </div>
          <button className="btn-primary" disabled={available.length === 0} onClick={start}>Start Quiz</button>
          {available.length === 0 && <div className="dim" style={{ fontSize: 12 }}>No questions match that filter — widen your selection.</div>}
        </div>
      </Panel>
    );
  }

  if (phase === "active") {
    const q = questions[idx];
    return (
      <Panel title={`Question ${idx + 1} of ${questions.length}`} icon={<ListChecks size={16} color="var(--keyword)" />}>
        <ProgressBar value={((idx) / questions.length) * 100} />
        <div className="dim mono" style={{ fontSize: 11, margin: "10px 0 2px" }}>{CONCEPT_MAP[q.conceptId].name}</div>
        <div className="quiz-q">{q.q}</div>
        <div className="stack-sm">
          {q.opts.map((o, i) => {
            let cls = "quiz-opt";
            if (picked != null) {
              if (i === q.correct) cls += " correct";
              else if (i === picked) cls += " incorrect";
            }
            return (
              <button key={i} className={cls} onClick={() => selectOpt(i)}>
                <span>{o}</span>
                {picked != null && i === q.correct && <CheckCircle2 size={16} />}
                {picked != null && i === picked && i !== q.correct && <XCircle size={16} />}
              </button>
            );
          })}
        </div>
        {picked != null && (
          <div className="explain-box">{q.exp}</div>
        )}
        {picked != null && (
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={next}>{idx + 1 < questions.length ? "Next question" : "See results"}</button>
        )}
      </Panel>
    );
  }

  return (
    <Panel title="Quiz Results" icon={<Award size={16} color="var(--string)" />}>
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-block"><div className="stat-num">{results.accuracy}<span className="stat-unit">%</span></div><div className="dim">Accuracy</div></div>
        <div className="stat-block"><div className="stat-num">{results.correctCount}/{results.total}</div><div className="dim">Correct</div></div>
        <div className="stat-block"><div className="stat-num">{Object.keys(results.byConcept).length}</div><div className="dim">Concepts covered</div></div>
      </div>
      <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>Per-concept breakdown — knowledge graph updated automatically</div>
      <ul className="list">
        {Object.entries(results.byConcept).map(([id, r]) => {
          const acc = Math.round((r.correct / r.total) * 100);
          const newMastery = Math.round((knowledge[id]?.mastery || 0) * 0.5 + acc * 0.5);
          return (
            <li key={id} className="list-row">
              <div className="row-title">{CONCEPT_MAP[id].name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="dim mono" style={{ fontSize: 12 }}>{r.correct}/{r.total} correct</span>
                <ChevronRight size={12} className="dim" />
                <MasteryPill mastery={newMastery} />
              </div>
            </li>
          );
        })}
      </ul>
      <button className="btn-primary" style={{ marginTop: 14 }} onClick={() => setPhase("setup")}>Take another quiz</button>
    </Panel>
  );
}

/* --------------------------------- CAREER AI --------------------------------- */

function CareerView({ knowledge, careerGoal, setCareerGoal }) {
  const matches = allCareerMatches(knowledge);
  return (
    <div className="stack-lg">
      <Panel title="AI Career Match" icon={<Briefcase size={16} color="var(--number)" />}>
        <div className="dim" style={{ fontSize: 13, marginBottom: 10 }}>Computed from your mastery across each role's weighted skill requirements.</div>
        <div className="stack-md">
          {matches.map(({ career, score }) => (
            <CareerCard key={career.id} career={career} score={score} knowledge={knowledge}
              isGoal={careerGoal === career.id} onSetGoal={() => setCareerGoal(career.id)} />
          ))}
        </div>
      </Panel>
    </div>
  );
}
function CareerCard({ career, score, knowledge, isGoal, onSetGoal }) {
  const [open, setOpen] = useState(false);
  const gaps = careerGaps(career.id, knowledge);
  return (
    <div className={`career-card${isGoal ? " is-goal" : ""}`}>
      <div className="career-head" onClick={() => setOpen((o) => !o)}>
        <div>
          <div className="row-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {career.name} {isGoal && <span className="chip chip-accent">Current goal</span>}
          </div>
          <div className="dim" style={{ fontSize: 12 }}>{career.blurb}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div className="stat-num" style={{ fontSize: 22 }}>{score}<span className="stat-unit">%</span></div>
          </div>
          {open ? <ChevronDown size={16} className="dim" /> : <ChevronRight size={16} className="dim" />}
        </div>
      </div>
      <ProgressBar value={score} colorVar="var(--number)" />
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="dim" style={{ fontSize: 12, marginBottom: 6 }}>Required skills vs your mastery</div>
          <ul className="list">
            {gaps.map((g) => (
              <li key={g.concept.id} className="list-row">
                <div className="row-title" style={{ fontSize: 13 }}>{g.concept.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, width: 160 }}>
                  <ProgressBar value={g.mastery} colorVar={BUCKET_COLOR[bucket(g.mastery)]} height={6} />
                  <span className="mono dim" style={{ fontSize: 11, width: 34 }}>{g.mastery}%</span>
                </div>
              </li>
            ))}
          </ul>
          <button className="btn-primary" style={{ marginTop: 10 }} onClick={(e) => { e.stopPropagation(); onSetGoal(); }} disabled={isGoal}>
            {isGoal ? "This is your goal" : "Set as career goal"}
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- ROADMAP --------------------------------- */

function RoadmapView({ knowledge, careerGoal, setTab }) {
  if (!careerGoal) {
    return (
      <Panel title="Your Roadmap" icon={<MapIcon size={16} color="var(--keyword)" />}>
        <div className="empty" style={{ padding: "24px 0" }}>
          No career goal set yet. Pick one on the Career AI tab and your roadmap generates automatically.
          <div style={{ marginTop: 12 }}><button className="btn-primary" onClick={() => setTab("career")}>Go to Career AI</button></div>
        </div>
      </Panel>
    );
  }
  const months = roadmapFor(careerGoal, knowledge);
  const career = CAREER_MAP[careerGoal];
  return (
    <div className="stack-lg">
      <Panel title={`Roadmap → ${career.name}`} icon={<MapIcon size={16} color="var(--keyword)" />}>
        <div className="dim" style={{ fontSize: 13 }}>Generated from the prerequisite chain of every skill this role needs, ordered by dependency and difficulty.</div>
      </Panel>
      <div className="timeline">
        {months.map((m) => (
          <div key={m.month} className="timeline-row">
            <div className="timeline-marker"><span className="mono">M{m.month}</span></div>
            <div className="timeline-card">
              {m.concepts.map((c) => (
                <div key={c.id} className="timeline-concept">
                  <span className={`dot ${c.isProject ? "" : bucket(knowledge[c.id]?.mastery || 0)}`} style={c.isProject ? { background: "var(--number)" } : undefined} />
                  <div>
                    <div className="row-title" style={{ fontSize: 14 }}>{c.name}</div>
                    <div className="dim" style={{ fontSize: 12 }}>{c.blurb}</div>
                  </div>
                  {!c.isProject && <MasteryPill mastery={knowledge[c.id]?.mastery || 0} />}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- APP SHELL --------------------------------- */

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "graph", label: "Knowledge Graph", icon: GitBranch },
  { id: "tutor", label: "AI Tutor", icon: Terminal },
  { id: "quiz", label: "Quiz", icon: ListChecks },
  { id: "career", label: "Career AI", icon: Briefcase },
  { id: "roadmap", label: "Roadmap", icon: MapIcon },
];
const FILES = { dashboard: "dashboard.py", graph: "knowledge_graph.py", tutor: "nexus_tutor.py", quiz: "quiz_engine.py", career: "career_ai.py", roadmap: "roadmap.py" };

const STORAGE_KEY = "edunexus-python-student";

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [quizPreset, setQuizPreset] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) setState(JSON.parse(res.value));
        else setState(seedState());
      } catch (e) {
        setState(seedState());
      } finally {
        setLoading(false);
        loadedRef.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !state) return;
    window.storage.set(STORAGE_KEY, JSON.stringify(state), false).catch(() => {});
  }, [state]);

  const updateKnowledge = useCallback((updater) => {
    setState((s) => ({ ...s, knowledge: updater(s.knowledge) }));
  }, []);

  const handleQuizComplete = useCallback((answers) => {
    setState((s) => {
      const knowledge = { ...s.knowledge };
      const byConcept = {};
      answers.forEach((a) => {
        byConcept[a.conceptId] = byConcept[a.conceptId] || { total: 0, correct: 0 };
        byConcept[a.conceptId].total++;
        if (a.correct) byConcept[a.conceptId].correct++;
      });
      Object.entries(byConcept).forEach(([id, r]) => {
        const acc = (r.correct / r.total) * 100;
        const old = knowledge[id]?.mastery || 0;
        knowledge[id] = { mastery: Math.round(old * 0.5 + acc * 0.5), lastStudied: new Date().toISOString(), attempts: (knowledge[id]?.attempts || 0) + 1 };
      });
      const correctTotal = answers.filter((a) => a.correct).length;
      return {
        ...s, knowledge,
        xp: s.xp + correctTotal * 15 + answers.length * 5,
        quizHistory: [...s.quizHistory, { date: new Date().toISOString(), total: answers.length, correct: correctTotal }],
      };
    });
  }, []);

  const handleChatSend = useCallback((text) => {
    setState((s) => {
      const response = tutorRespond(text, s.knowledge);
      const assistantMsg = typeof response === "string" ? { role: "assistant", text: response } : { role: "assistant", ...response };
      return { ...s, chatHistory: [...s.chatHistory, { role: "user", text }, assistantMsg] };
    });
  }, []);

  const setCareerGoal = useCallback((id) => setState((s) => ({ ...s, careerGoal: id })), []);

  const resetDemo = useCallback(() => {
    const fresh = seedState();
    setState(fresh);
  }, []);

  if (loading || !state) {
    return (
      <div className="app-root" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
        <style>{GLOBAL_CSS}</style>
        <div className="mono dim">booting edunexus-python-track…</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <style>{GLOBAL_CSS}</style>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title"><Code2 size={18} color="var(--keyword)" /> EduNexus<span style={{ color: "var(--keyword)" }}>AI</span></div>
          <div className="mono dim" style={{ fontSize: 11 }}>&gt;&gt;&gt; python_track</div>
        </div>
        <nav className="nav">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} className={`nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="avatar">DS</div>
            <div>
              <div className="row-title" style={{ fontSize: 13 }}>{state.studentName}</div>
              <div className="dim mono" style={{ fontSize: 11 }}>Streak {state.streak}d · {state.xp} XP</div>
            </div>
          </div>
          <button className="link-btn" style={{ marginTop: 10 }} onClick={resetDemo}><RotateCcw size={12} /> Reset demo data</button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <span className="mono dim" style={{ fontSize: 12 }}>python_track / {FILES[tab]}</span>
          <span className="mono dim" style={{ fontSize: 12 }}>Knowledge {knowledgeScore(state.knowledge)}% · Readiness {readinessScore(state.knowledge)}%</span>
        </div>
        <div className="content">
          {tab === "dashboard" && <Dashboard state={state} setTab={setTab} setQuizPreset={setQuizPreset} />}
          {tab === "graph" && <KnowledgeGraph knowledge={state.knowledge} careerGoal={state.careerGoal} />}
          {tab === "tutor" && <TutorView knowledge={state.knowledge} chatHistory={state.chatHistory} onSend={handleChatSend} />}
          {tab === "quiz" && <QuizView knowledge={state.knowledge} onComplete={handleQuizComplete} preset={quizPreset} clearPreset={() => setQuizPreset(null)} />}
          {tab === "career" && <CareerView knowledge={state.knowledge} careerGoal={state.careerGoal} setCareerGoal={setCareerGoal} />}
          {tab === "roadmap" && <RoadmapView knowledge={state.knowledge} careerGoal={state.careerGoal} setTab={setTab} />}
        </div>
      </main>
    </div>
  );
}

/* --------------------------------- STYLES --------------------------------- */

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root{
  --bg:#1e1e2e; --bg-elevated:#262638; --bg-inset:#16161f; --border:#33334a;
  --text:#e4e4f0; --text-dim:#9494ad;
  --keyword:#7da6ff; --string:#a6e3a1; --function:#f9e2af; --number:#cba6f7; --error:#f38ba8; --comment:#6c7086;
}
.app-root{ display:flex; min-height:100vh; background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; }
.mono{ font-family:'JetBrains Mono', monospace; }
.dim{ color:var(--text-dim); }
.display{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:26px; margin:0; letter-spacing:-0.01em; }

.sidebar{ width:230px; flex-shrink:0; background:var(--bg-inset); border-right:1px solid var(--border); display:flex; flex-direction:column; padding:18px 14px; }
.brand-title{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:17px; display:flex; align-items:center; gap:6px; }
.brand{ margin-bottom:22px; padding:0 4px; }
.nav{ display:flex; flex-direction:column; gap:2px; flex:1; }
.nav-item{ display:flex; align-items:center; gap:10px; padding:9px 10px; border-radius:8px; background:transparent; border:none; color:var(--text-dim); font-size:13.5px; font-family:'Inter',sans-serif; cursor:pointer; text-align:left; }
.nav-item:hover{ background:var(--bg-elevated); color:var(--text); }
.nav-item.active{ background:color-mix(in srgb, var(--keyword) 16%, transparent); color:var(--keyword); }
.sidebar-footer{ border-top:1px solid var(--border); padding-top:12px; }
.profile-card{ display:flex; align-items:center; gap:10px; }
.avatar{ width:32px; height:32px; border-radius:8px; background:var(--keyword); color:#12121c; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; font-family:'Space Grotesk',sans-serif; }

.main{ flex:1; display:flex; flex-direction:column; min-width:0; }
.topbar{ height:38px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 20px; background:var(--bg-inset); }
.content{ padding:24px; overflow-y:auto; }

.stack-lg{ display:flex; flex-direction:column; gap:20px; }
.stack-md{ display:flex; flex-direction:column; gap:14px; }
.stack-sm{ display:flex; flex-direction:column; gap:8px; }

.grid-4{ display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.grid-3{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.grid-2{ display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:900px){ .grid-4{grid-template-columns:repeat(2,1fr);} .grid-2{grid-template-columns:1fr;} .grid-3{grid-template-columns:1fr;} }

.panel{ background:var(--bg-elevated); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.panel-head{ display:flex; align-items:center; justify-content:space-between; padding:13px 16px; border-bottom:1px solid var(--border); }
.panel-title{ display:flex; align-items:center; gap:8px; font-weight:600; font-size:14px; }
.panel-body{ padding:16px; }

.stat-num{ font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:32px; line-height:1; }
.stat-unit{ font-size:16px; font-weight:500; color:var(--text-dim); }
.stat-block{ text-align:center; padding:14px; background:var(--bg-inset); border-radius:10px; border:1px solid var(--border); }

.list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.list-row{ display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 10px; background:var(--bg-inset); border-radius:8px; border:1px solid var(--border); }
.row-title{ font-weight:600; font-size:13.5px; }
.empty{ color:var(--text-dim); font-size:13px; padding:8px 0; }

.rec-card{ background:var(--bg-inset); border:1px solid var(--border); border-radius:10px; padding:13px; }
.rec-head{ display:flex; align-items:center; gap:8px; }
.link-btn{ background:none; border:none; color:var(--text-dim); font-size:12px; display:flex; align-items:center; gap:4px; cursor:pointer; padding:0; }
.link-btn:hover{ color:var(--keyword); }
.explain-list{ margin:6px 0 0; padding-left:16px; font-size:11.5px; color:var(--text-dim); display:flex; flex-direction:column; gap:3px; }
.explain-box{ margin-top:10px; padding:10px 12px; background:var(--bg-inset); border-left:2px solid var(--keyword); border-radius:6px; font-size:12.5px; color:var(--text-dim); }

.btn-primary{ background:var(--keyword); color:#12121c; border:none; padding:9px 16px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:6px; }
.btn-primary:disabled{ opacity:.4; cursor:not-allowed; }
.btn-ghost{ background:transparent; border:1px solid var(--border); color:var(--text-dim); padding:6px 10px; border-radius:7px; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:4px; }
.btn-ghost:hover{ color:var(--text); border-color:var(--keyword); }

.kv{ display:flex; align-items:center; justify-content:space-between; font-size:13px; }
.kv span:first-child{ color:var(--text-dim); }
.chip-row{ display:flex; flex-wrap:wrap; gap:6px; }
.chip{ font-size:11.5px; padding:4px 9px; border-radius:999px; background:var(--bg-inset); border:1px solid var(--border); color:var(--text-dim); }
.chip-accent{ background:color-mix(in srgb, var(--keyword) 18%, transparent); color:var(--keyword); border-color:color-mix(in srgb, var(--keyword) 45%, transparent); }
.chip-btn{ cursor:pointer; }
.chip-btn:hover{ border-color:var(--keyword); color:var(--text); }

.graph-toolbar{ display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; }
.search-box{ display:flex; align-items:center; gap:8px; background:var(--bg-elevated); border:1px solid var(--border); border-radius:8px; padding:7px 10px; width:240px; }
.search-box input{ background:none; border:none; outline:none; color:var(--text); font-size:13px; width:100%; }
.legend{ display:flex; gap:12px; flex-wrap:wrap; }
.legend-item{ display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-dim); }
.legend-item i{ width:8px; height:8px; border-radius:50%; display:inline-block; }
.graph-wrap{ background:var(--bg-elevated); border:1px solid var(--border); border-radius:12px; padding:10px; overflow-x:auto; }

.repl{ background:var(--bg-inset); border:1px solid var(--border); border-radius:10px; padding:14px; max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; }
.repl-prompt{ color:var(--string); font-size:13px; }
.repl-response{ font-size:13.5px; line-height:1.5; padding-left:2px; }
.code-block{ background:#12121c; border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-top:8px; font-size:12px; color:var(--function); overflow-x:auto; white-space:pre; }
.repl-input{ display:flex; align-items:center; gap:8px; background:var(--bg-inset); border:1px solid var(--border); border-radius:8px; padding:8px 10px; }
.repl-input input{ flex:1; background:none; border:none; outline:none; color:var(--text); font-size:13.5px; font-family:'JetBrains Mono',monospace; }

.form-row{ display:flex; flex-direction:column; gap:6px; }
.form-row label{ font-size:12px; color:var(--text-dim); }
.form-row select, .form-row input[type=range]{ background:var(--bg-inset); border:1px solid var(--border); color:var(--text); border-radius:7px; padding:8px 10px; font-size:13px; }

.quiz-q{ font-family:'Space Grotesk',sans-serif; font-weight:600; font-size:17px; margin:10px 0 14px; }
.quiz-opt{ display:flex; align-items:center; justify-content:space-between; width:100%; text-align:left; background:var(--bg-inset); border:1px solid var(--border); color:var(--text); padding:11px 14px; border-radius:9px; font-size:13.5px; cursor:pointer; }
.quiz-opt:hover{ border-color:var(--keyword); }
.quiz-opt.correct{ border-color:var(--string); background:color-mix(in srgb, var(--string) 12%, var(--bg-inset)); color:var(--string); }
.quiz-opt.incorrect{ border-color:var(--error); background:color-mix(in srgb, var(--error) 12%, var(--bg-inset)); color:var(--error); }

.career-card{ background:var(--bg-inset); border:1px solid var(--border); border-radius:10px; padding:14px; }
.career-card.is-goal{ border-color:var(--number); }
.career-head{ display:flex; align-items:center; justify-content:space-between; cursor:pointer; margin-bottom:8px; }

.timeline{ position:relative; padding-left:8px; }
.timeline-row{ display:flex; gap:16px; padding-bottom:20px; }
.timeline-marker{ width:40px; height:40px; border-radius:10px; background:var(--bg-elevated); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; flex-shrink:0; color:var(--keyword); font-size:12px; }
.timeline-card{ flex:1; background:var(--bg-elevated); border:1px solid var(--border); border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:10px; }
.timeline-concept{ display:flex; align-items:center; gap:10px; }
.timeline-concept .dot{ width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.dot.unstarted{ background:var(--comment); } .dot.weak{ background:var(--error); } .dot.developing{ background:var(--function); } .dot.strong{ background:var(--string); }
`;
