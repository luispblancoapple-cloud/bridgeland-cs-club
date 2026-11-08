export type UILTest = {
  id: string;
  year: number;
  level: string;
  pdfUrl: string;
  archiveUrl: string;
  questions: number;
  minutes: number;
  pointsCorrect: number;
  penaltyIncorrect: number;
  writtenQuestions: number[];
};

const archive: Record<number, string> = {
  2026: "https://www.uiltexas.org/academics/page/high-school-academic-study-materials",
  2025: "https://www.uiltexas.org/academics/page/2025-high-school-academic-study-materials",
  2024: "https://www.uiltexas.org/academics/page/2024-high-school-academic-study-materials",
  2023: "https://www.uiltexas.org/academics/page/2023-high-school-academic-study-materials",
  2022: "https://www.uiltexas.org/academics/page/2022-high-school-academic-study-materials",
};

const files: Record<number, [string, string][]> = {
  2026: [
    ["Invitational A", "CompSci_WrittenTest_SM_A_26.pdf"],
    ["Invitational B", "CompSci_WrittenTest_SM_B_26.pdf"],
    ["District", "CompSci_Written_SM_D_26.pdf"],
    ["Region", "CompSci_Written_SM_R_16.pdf"],
    ["State", "CompSci_Written_SM_S_26.pdf"],
  ],
  2025: [
    ["Invitational A", "CompSciWritten_StudyPacket_A_25.pdf"],
    ["Invitational B", "CompSciWritten_StudyPacket_B_25.pdf"],
    ["District", "CompSciWritten_StudyPacket_D_25.pdf"],
    ["Region", "CompSciWritten_StudyPacket_R_25.pdf"],
    ["State", "CompSci_StudyPacket_S_25.pdf"],
  ],
  2024: [
    ["Invitational A", "CompSciWritten_StudyPacket_A_24.pdf"],
    ["Invitational B", "CompSciWritten_StudyPacket_B_24.pdf"],
    ["District", "CompSciWritten_StudyPacket_D_24.pdf"],
    ["Region", "CompSciWritten_StudyPacket_R_24.pdf"],
    ["State", "CompSciWritten_StudyPacket_S_2024.pdf"],
  ],
  2023: [
    ["Invitational A", "CompSci_StudyPacket_A_23.pdf"],
    ["Invitational B", "CompSci_StudyPacket_B_23.pdf"],
    ["District", "CompSci_StudyPacket_D_23.pdf"],
    ["Region", "CompSci_StudyPacket_R_23.pdf"],
    ["State", "CompSci_StudyPacket_S_23.pdf"],
  ],
  2022: [
    ["Invitational A", "CompSciW_A_22.pdf"],
    ["Invitational B", "CompSciW_B_22.pdf"],
    ["District", "CompSciW_D_22.pdf"],
    ["Region", "CompSciW_R_22.pdf"],
    ["State", "CompSciW_StudyPacket_S_22.pdf"],
  ],
};

export const UIL_TESTS: UILTest[] = Object.entries(files).flatMap(([year, tests]) =>
  tests.map(([level, file]) => ({
    id: `${year}-${level.toLowerCase().replaceAll(" ", "-")}`,
    year: Number(year),
    level,
    pdfUrl: `https://www.uiltexas.org/files/academics/${file}`,
    archiveUrl: archive[Number(year)],
    questions: 40,
    minutes: 45,
    pointsCorrect: 6,
    penaltyIncorrect: 2,
    writtenQuestions: year === "2026" && level === "Invitational B" ? [1, 39, 40] : [39, 40],
  })),
).sort((a, b) => b.year - a.year || a.level.localeCompare(b.level));

export const FIRST_15_TIPS = [
  { title: "1. Number bases, arithmetic, and conversion", steps: ["Identify the starting and target bases.", "For base-to-decimal, multiply each digit by its place value and add.", "For decimal-to-base, repeatedly divide by the target base and read remainders upward.", "For arithmetic in another base, use that base's carry and borrow values.", "Check by converting the result back to decimal."], watch: "Digits must be smaller than the base; for example, base 5 uses only 0–4." },
  { title: "2. Literal math expressions", steps: ["Evaluate parentheses first.", "Handle unary signs and powers where present.", "Do multiplication, division, and remainder left to right.", "Then do addition and subtraction left to right.", "Keep track of integer division versus decimal division."], watch: "Java integer division truncates toward zero; it does not round." },
  { title: "3. print, println, and printf", steps: ["Read each output call in order.", "Track whether print adds a newline (it does not) or println does.", "Substitute each printf value into the matching format specifier.", "Resolve newline, tab, and escaped-quote sequences in strings.", "Write the exact output, including spaces and line breaks."], watch: "A backslash escape inside a string can create a real newline, and println adds another one." },
  { title: "4. String methods", steps: ["Write the string with indices starting at 0.", "Check whether a method changes the string or returns a new one.", "For substring(begin, end), include begin and stop before end.", "Trace indexOf, charAt, length, and concatenation precisely.", "Compare strings by contents with equals unless the question asks about references."], watch: "Strings are immutable; ignoring a returned string leaves the original unchanged." },
  { title: "5. Basic Boolean logic", steps: ["List the truth value of each variable or comparison.", "Use parentheses first, then Java's Boolean precedence: !, &, ^, |, &&, ||.", "Within the same precedence level, evaluate left to right; note that && and || short-circuit.", "Use a small truth table if the expression is hard to track.", "Check whether the question asks for true/false or a printed result."], watch: "^ is Boolean XOR for booleans; it is not the same as ||." },
  { title: "6. Math methods", steps: ["Identify each method and its argument types.", "Evaluate the innermost call first.", "Track whether the result is int, long, or double.", "Apply floor, ceil, round, abs, min, max, sqrt, or pow exactly.", "Substitute the result back into the surrounding expression."], watch: "Math.round returns a long for a double input; floor and ceil return doubles." },
  { title: "7. Variable expressions", steps: ["Record each variable's starting value and type.", "Apply parentheses and Java operator precedence.", "For ++ and --, distinguish prefix from postfix value.", "Evaluate the complete right-hand side before assignment.", "Update the variable only at the point the expression requires."], watch: "Postfix i++ uses the old value in the expression, then increments i." },
  { title: "8. if, if/else, and switch", steps: ["Evaluate conditions from top to bottom.", "Follow only the first true branch in an if/else chain.", "For switch, find the matching case or default.", "Continue through later cases until a break or switch end.", "If the code uses ?:, evaluate its condition and then only the selected branch."], watch: "A switch may fall through without break; a ternary expression chooses one of two branches." },
  { title: "9. Simple output loops", steps: ["Write the loop variable's initial value.", "Check the condition before each iteration.", "Record every statement in the loop body, including output.", "Apply the update expression after the body.", "Stop as soon as the condition becomes false."], watch: "A continue skips the rest of the body but still proceeds to the loop update." },
  { title: "10. One-dimensional primitive arrays", steps: ["Count the elements and note that the first index is 0.", "Write each index/value pair if the array is modified.", "Use length as the number of elements, not the last index.", "Trace assignments and reads in order.", "Check every index is between 0 and length - 1."], watch: "The last valid index is array.length - 1." },
  { title: "11. Scanner and File input", steps: ["Identify the input source and the order tokens are read.", "Match nextInt/nextDouble/next to one token and nextLine to the rest of a line.", "Track the file or scanner position after each read.", "Parse text only when needed, using the correct parse method.", "Check for a leftover newline after token-based reads."], watch: "nextLine immediately after nextInt may consume the remainder of the current line." },
  { title: "12. Accumulation loops", steps: ["Choose the starting value: 0 for a sum, 1 for a product.", "Trace each loop item exactly once unless the code says otherwise.", "Apply the update to the accumulator in order.", "Track the loop counter and accumulator in a small table.", "Report the final accumulator after the loop ends."], watch: "Initialize a product to 1, not 0." },
  { title: "13. Full Java precedence", steps: ["Resolve parentheses first.", "Then unary, multiplicative, additive, and shift operators.", "Then relational and equality comparisons.", "Then bitwise &, ^, |, followed by && and ||.", "Finish with conditional and assignment operators; follow associativity when levels match."], watch: "Operators at the same precedence usually group left to right, except assignment and ?: group right to left." },
  { title: "14. Primitive ranges, wraparound, and complements", steps: ["Identify the primitive type and its bit width.", "Use the signed range −2^(n−1) through 2^(n−1)−1 for an n-bit integer type.", "Track overflow using two's-complement wraparound.", "For ~x, invert every bit and interpret the signed result.", "Check promotion and cast rules before deciding the final type."], watch: "Java byte, short, and char values are promoted in many arithmetic expressions." },
  { title: "15. ArrayList generics", steps: ["Read the generic type to know which values are stored.", "Track list contents by index, starting at 0.", "Use size() for the number of elements; the last index is size() - 1.", "Apply add, get, set, and remove in the order shown.", "After removals or insertions, update all later indices."], watch: "remove(1) removes the element at index 1; it does not search for the value 1." },
];

export const UIL_TOPIC_UNITS = [
  { title: "Java foundations", topics: ["Primitive types: int, double, boolean, short, long, byte, char, float; casting", "Arithmetic operators and String concatenation", "Assignment operators", "Increment/decrement and values in expressions", "Boolean expressions and operators, including short circuit", "Bitwise operators", "Branching: if, if/else, ?:, switch, break", "Looping: while, for, enhanced for, return, do/while, break, continue", "Output: print, println, printf, format specifiers, escape sequences", "Parsing: String.split, parseInt, parseDouble", "Number-base conversions and arithmetic; bit integers"] },
  { title: "Classes and object-oriented Java", topics: ["User-defined classes: constructors, methods, instance variables, access modifiers", "Overloading and overriding; final and static", "Inheritance and abstract classes", "Encapsulation, interfaces, and polymorphism", "Casts and reference comparison: equals, ==, !=, compareTo", "Enum types", "Design patterns: Singleton, Factory, Strategy"] },
  { title: "Arrays, collections, and Java library", topics: ["Arrays, arrays of arrays, and initialization", "Generic collections: Collection, List, Set, Map, Stack, Queue, PriorityQueue", "ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap", "Regular expressions with Pattern and Matcher", "Arrays.sort and Collections.sort", "Standard library: String, Integer, Double, Character, Math, Object, Comparable, Scanner, File, Random, Arrays, Assert", "Lambdas and functional interfaces; functional features in Java"] },
  { title: "Data structures", topics: ["Arrays and lists", "Stacks and queues", "Linked lists", "Trees: BST, AVL, and Red-Black", "Heaps and priority queues", "Hash tables", "Graphs and tries", "Disjoint Set Union (DSU)", "Segment trees and Fenwick trees"] },
  { title: "Algorithms and complexity", topics: ["Sorting and searching", "Recursion", "Dynamic programming (programming portion only; not written tests)", "Greedy algorithms", "Computational geometry", "Algorithm analysis and Big-O"] },
  { title: "Logic and computer science theory", topics: ["Boolean simplification with notation, truth tables, and identities", "Simple infix, prefix, and postfix (Polish) notation", "Finite state machines", "Languages, formal grammars, BNF, and language classification", "Multithreading and concurrency basics", "Digital electronics: NOT, AND, XOR, OR, NAND, NOR, NXOR"] },
];
