export type UILWrittenQuestion = {
  topic: string;
  prompt: string;
  code?: string;
  sharedContext?: string;
  choices: string[];
  answer: number | string;
  sourceTestId: string;
  sourceLabel: string;
  sourceQuestion: number;
};

export type UILWrittenTest = {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questions: UILWrittenQuestion[];
};

const q = (sourceTestId: string, sourceLabel: string, sourceQuestion: number, topic: string, prompt: string, choices: string[], answer: number | string, code?: string, sharedContext?: string): UILWrittenQuestion => ({
  sourceTestId, sourceLabel, sourceQuestion, topic, prompt, choices, answer, code, sharedContext,
});

const district2025InheritanceContext = `class A { int y; public A(int n) { y = n; } public int get() { return y; } }
class B extends A { int y; public B(int n) { <1*> } public void add() { y++; } }
A a = new A(3); B b = new B(4);
String s = ""; s += a.get() + " "; out.println(s + b.get()); // q25
b.add(); b.add(); out.println(b); // q26
A c = new B(6); c.add(); out.println(c.get()); // q27`;

// These topic sets use the same question positions highlighted in the UIL first-15
// guide, drawing actual questions from five UIL packets spanning 2022–2026.
export const UIL_WRITTEN_TESTS: UILWrittenTest[] = [
  {
    id: "number-systems-arithmetic",
    title: "Number Systems & Arithmetic",
    description: "Practice number-base conversion and Java arithmetic, including operator precedence and integer division.",
    difficulty: "Medium",
    questions: [
      q("2022-district", "2022 District", 1, "Number bases", "Which of the following is equal to DC₁₆ − BD₁₆?", ["21₁₆", "47₁₀", "11110₂", "1F₁₆", "None of these"], 3),
      q("2022-district", "2022 District", 2, "Arithmetic expressions", "What is the output?", ["1", "49", "28", "28.0", "There is no output due to a syntax error"], 0, "out.print(14 + -3 - +3 * 7 / 2);"),
      q("2023-region", "2023 Region", 1, "Number bases", "Which value is different from the other four?", ["10110101₂", "2311₄", "265₈", "183₁₀", "B5₁₆"], 3),
      q("2023-region", "2023 Region", 2, "Integer division and remainder", "What is the output?", ["8", "1066", "52", "53", "9"], 0, "out.print(800 / 3 % 10 + 800 / 10 % 3);"),
      q("2024-district", "2024 District", 1, "Number bases", "Find the product of 110011₂ and 64₁₀.", ["6415₈", "6410₈", "775₈", "6300₈", "6214₈"], 3),
      q("2024-district", "2024 District", 2, "Integer division and remainder", "What is the output?", ["−12", "−8", "−4", "1", "2"], 0, "out.print(12 - 27 + 17 % 10 / 2);"),
      q("2025-district", "2025 District", 1, "Number bases", "Which expression is not equivalent to 2523₇ + AB7₁₆?", ["2856₁₁", "7153₈", "1161₁₅", "104231₅", "All are equivalent"], 4),
      q("2025-district", "2025 District", 2, "Operator precedence", "What is the output?", ["1", "9", "7", "0", "There is no output due to a compile error"], 2, "out.println(1 + 2 * 3 - 4 / 5);"),
      q("2026-district", "2026 District", 1, "Number bases", "Which of the following is equivalent to 456₈ + 711₈?", ["745₁₀", "744₈", "2E7₁₆", "1011100111₂", "1367₈"], 4),
      q("2026-district", "2026 District", 2, "Operator precedence", "What is output by the code?", ["10.5", "24", "23.25", "23", "25"], 1, "int a = 15;\nint b = 4;\nint c = 3;\nint result = a + b * c - a / b;\nout.println(result);"),
    ],
  },
  {
    id: "string-methods",
    title: "String Methods",
    description: "Trace substring, index, comparison, and formatting methods across UIL written questions.",
    difficulty: "Medium",
    questions: [
      q("2022-district", "2022 District", 4, "String methods", "What is the output?", ["1", "2", "3", "5", "−1"], 2, 'out.print("banana".lastIndexOf("a", 3));'),
      q("2022-invitational-b", "2022 Invitational B", 4, "String methods", "What is the output?", ["4", "5", "6", "7", "8"], 3, 'String str = "hello world";\nout.print(str.lastIndexOf(\'o\'));'),
      q("2023-region", "2023 Region", 4, "Substring and indexing", "What is the output?", ["Com", "omp", "cie", "nce", "ute"], 2, 'String Go = "ComputerScience";\nString Fight = Go.substring(4);\nString Win = Fight.substring(4);\nout.print(Win.substring(1, 4));'),
      q("2023-district", "2023 District", 4, "Substring and indexOf", "What is the output?", ["0", "2", "3", "7", "−1"], 4, 'String str = "University";\nString yes = str.substring(3, 7);\nout.print(yes.indexOf("i"));'),
      q("2024-district", "2024 District", 4, "String concatenation", "What is the output?", ["A", "S", "C", "I", "T"], 0, 'String St1 = "KANSAS";\nString St2 = "CITY";\nString St3 = St2 + St1.substring(0, 3);\nout.print(St3.charAt(5));'),
      q("2024-region", "2024 Region", 4, "substring", "What is the output?", ["M", "MA", "MAD", "MADN", "ADN"], 2, 'String St1 = "MARCH";\nString St2 = "MADNESS";\nint A = St1.indexOf("R");\nint B = St2.indexOf("S");\nout.print(St2.substring(A - 2, B - 2));'),
      q("2024-invitational-b", "2024 Invitational B", 4, "substring", "What is the output?", ["O", "ON", "T", "TON", "AN"], 1, 'String St1 = "MICHIGAN";\nString St2 = "WASHINGTON";\nout.print(St2.substring(St1.length()));'),
      q("2025-district", "2025 District", 4, "substring and concatenation", "What is the output?", ["untDoot", "ntDookt", "ntDookn", "untDoon", "There is no output due to a runtime error"], 3, 'String str = "CountDooku";\nstr = str.substring(0, 8);\nstr += str.charAt(3);\nout.println(str.substring(2));'),
      q("2025-region", "2025 Region", 4, "String immutability and concatenation", "What is the output?", ["nityStoit", "InfinityStone207", "nitySto221", "InfinityStonefi", "There is no output due to a runtime error"], 1, 'String s = "InfinityStone";\ns.substring(1, s.length() - 2);\ns += s.charAt(2) + s.charAt(5);\ns.substring(3);\nout.println(s);'),
      q("2026-district", "2026 District", 4, "String methods", "What is the output?", ["hexlo 5", "Hello World 11", "Hexxo 5", "hexxo 5", "hello 5"], 3, 'String text = "  Hello World  ";\nString result = text.trim().toLowerCase()\n    .substring(0, 5).replace(\'l\', \'x\');\nout.println(result + " " + result.length());'),
    ],
  },
  {
    id: "branching-loops",
    title: "Branching & Loops",
    description: "Trace if/else and switch behavior, loop bounds, updates, and repeated output.",
    difficulty: "Medium",
    questions: [
      q("2022-district", "2022 District", 8, "Branching", "What is the output?", ["small x", "big X", "small X", "crazy", "There is no output due to a compile error"], 0, "char ch = 'X';\nchar space = ' ';\nif (ch % 2 == 0) ch += space;\nif (Character.isLowerCase(ch)) out.print(\"small \" + ch);\nelse if (Character.isUpperCase(ch)) out.print(\"big \" + ch);\nelse out.print(\"crazy\");"),
      q("2022-district", "2022 District", 9, "Loop bounds", "How many asterisks are printed?", ["13", "24", "26", "28", "52"], 2, "for (int x = 17; x <= 41; x += 2) {\n    out.print(\"**\");\n}"),
      q("2022-region", "2022 Region", 8, "Switch statements", "What is the output?", ["1", "2", "3", "6", "There is no output due to a compile error"], 2, 'int r = 1;\nswitch ("case") {\n    case "c": r++;\n    case "ca": r++;\n    case "cas": r++;\n    case "case": r++;\n    default: r++;\n}\nout.print(r);'),
      q("2022-region", "2022 Region", 9, "Loop bounds", "How many asterisks are printed?", ["20", "21", "40", "42", "166"], 3, 'for (int x = 7; x <= 89; x += 4) {\n    out.print("**");\n}'),
      q("2023-region", "2023 Region", 8, "Branching", "What is the output?", ["10 2 4", "11 10 11", "10 10 10", "11 10 10", "10 10 11"], 3, "int D = 10, R = 2, P = 4;\nif (D + R > P) P = D; else D = P;\nif (D + P > R) R = D; else D = R;\nif (P + R > D) D++; else D--;\nout.print(D + \" \" + P + \" \" + R);"),
      q("2023-region", "2023 Region", 9, "Loop updates", "What is the output?", ["125", "12514", "14", "5", "8"], 0, 'String St = "";\nfor (int x = 1; x < 10; x = x * 3 - 1) St += x;\nout.println(St);'),
      q("2024-district", "2024 District", 8, "Branching", "What is the output?", ["14", "15", "16", "17", "18"], 3, "int A = 5;\nint B = A - 1;\nint C = B + 2;\nif (A > B) C++;\nif (C < A) B++;\nif (B < C) A++;\nout.print(A + B + C);"),
      q("2023-state", "2023 State", 9, "Loop updates", "What is the output?", ["11121314151", "2345", "14", "1021324354", "111213141"], 4, "for (int x = 1; x <= 50; x += 10)\n    out.print(x / 10 * 10 + x % 10);"),
      q("2026-district", "2026 District", 8, "Branching and switch", "What is the output?", ["B", "B1", "B12", "C2", "A12"], 2, 'int x = 7, y = 3;\nString result = "";\nif (x > 5)\n    if (y > 5) result = "A";\n    else result = "B";\nelse if (x > 3) result = "C";\nelse result = "D";\nswitch (result) {\n    case "A":\n    case "B": result += "1";\n    case "C": result += "2"; break;\n    default: result += "3";\n}\nout.println(result);'),
      q("2026-district", "2026 District", 9, "Nested loops", "On which commented line should the inner loop be placed to center the output pyramid?", ["line 1", "line 2", "line 3", "line 4"], 0, 'for (int i = 1; i <= 4; i++) {\n    // line 1\n    for (int k = 1; k <= 2 * i - 1; k++) {\n        // line 2\n        out.print("*"); // line 3\n    } // line 4\n    out.println();\n}\n\nInsert this loop: for (int j = 4; j > i; j--) { out.print("   "); }'),
    ],
  },
  {
    id: "arrays-accumulation",
    title: "Arrays & Accumulation",
    description: "Work through array indexing and trace sum, product, and accumulator loops.",
    difficulty: "Medium",
    questions: [
      q("2022-district", "2022 District", 10, "Array assignments", "What is the output?", ["[3, 1, 4, 1, 5, 9]", "[3, 1, 4, 4, 1, 3]", "[9, 5, 1, 1, 5, 9]", "[5, 1, 6, 4, 0, 5]", "There is no output due to an error"], 1, "int[] ints = {9, 5, 1, 4, 1, 3};\nints[0] = ints[ints.length - 1];\nints[ints.length - 1] = ints[0];\nints[1] = ints[ints.length - 2];\nints[ints.length - 2] = ints[1];\nints[2] = ints[ints.length - 3];\nints[ints.length - 3] = ints[2];\nout.print(Arrays.toString(ints));"),
      q("2022-district", "2022 District", 12, "Accumulation loops", "What is the output?", ["127", "1364", "341", "340", "None of the above"], 2, "int y = 0;\nfor (int x = 1; x <= 16; x *= 2) y += x * x;\nout.print(y);"),
      q("2023-region", "2023 Region", 10, "Array indexing", "What is the output?", ["32", "34", "35", "36", "38"], 3, "int[] perfect = new int[25];\nfor (int x = 0; x < 24; x++) perfect[x] = x * x - 1;\nout.print(perfect[10] - perfect[8]);"),
      q("2023-region", "2023 Region", 12, "Accumulation loops", "What is the output?", ["50", "25", "4", "33", "17"], 2, "int strange = 100;\nfor (int x = 2; x <= 4; x++) strange /= x;\nout.print(strange);"),
      q("2024-district", "2024 District", 10, "Array indexing", "What is the output?", ["60", "65", "70", "75", "80"], 2, "int[] elf = new int[50];\nfor (int x = 0; x <= 49; x++) elf[x] = x * 2 + 5;\nout.print(elf[10] + elf[20]);"),
      q("2024-district", "2024 District", 12, "Loop accumulation", "What is the output?", ["-5 -4 -3 -2 -1 0 1 2 3 4 5", "-5 -2 1 4", "-10 -6 4 20", "-5 -4 3 16", "-5 -6 4 20"], 3, 'for (int i = -5, T = 1; i <= 5; i = i + 3, T++)\n    out.print(i * T + " ");'),
      q("2025-district", "2025 District", 10, "Array traversal", "What is the output?", ["1", "3", "5", "2", "There is no output due to a runtime error"], 0, "int[] i = {3, 2, 5, 4, 1, 0};\nint j = 3;\nfor (int k = 0; k < 25; k++) j = i[j];\nout.println(i[j]);"),
      q("2025-district", "2025 District", 12, "Nested accumulation loops", "What is the output?", ["109", "97", "128", "115", "There is no output due to a runtime error"], 1, "int sum = 1;\nfor (int y = 0; y < 12; y++) {\n    sum += y;\n    for (int x = 0; x < y / 2; x++) sum++;\n}\nout.println(sum);"),
      q("2026-district", "2026 District", 10, "Array assignments", "What is the output?", ["10 6 21", "6 4 15", "10 4 14", "10 4 19"], 3, "int[] arr = {2, 4, 6, 8, 10};\narr[1] = arr[0] + arr[3];\narr[4] = arr[1] - arr[2];\nint result = arr[1] + arr[4] + arr.length;\nout.println(arr[1] + \" \" + arr[4] + \" \" + result);"),
      q("2026-district", "2026 District", 12, "Enhanced for loops", "What is the output?", ["15 12", "12 15", "12 8", "20 15", "6 15"], 1, "int[] nums = {3, 5, 2, 4, 6};\nint sum = 0, product = 1;\nfor (int n : nums) {\n    if (n % 2 == 0) sum += n;\n    else product *= n;\n}\nout.println(sum + \" \" + product);"),
    ],
  },
  {
    id: "logic-operators",
    title: "Boolean & Bitwise Operators",
    description: "Practice Boolean truth, XOR, bitwise AND/OR, shifts, and operator precedence.",
    difficulty: "Hard",
    questions: [
      q("2022-district", "2022 District", 5, "Boolean logic", "What is the output?", ["true", "false"], 1, "boolean t = true;\nboolean f = false;\nboolean tt = true;\nboolean ff = false;\nout.print(t ^ f ^ tt ^ ff);"),
      q("2022-district", "2022 District", 16, "Bitwise AND", "What is the output?", ["4", "5", "7", "8", "There is no output due to a compile error"], 1, "int x = 7;\nint y = 4;\nif ((x & 9) == 1 & y++ == 4) out.println(y);\nelse out.println(x);"),
      q("2023-region", "2023 Region", 5, "Boolean XOR", "What is the output?", ["true", "false"], 1, "boolean R = !false;\nboolean S = R || false;\nboolean T = R && S;\nboolean U = S ^ T;\nout.print(U);"),
      q("2023-region", "2023 Region", 13, "Bitwise shifts and XOR", "What is the output?", ["44", "321", "41", "322", "324"], 1, "int Q = 20;\nout.print(Q << 2 + 2 ^ 3 >> 1);"),
      q("2024-district", "2024 District", 5, "Boolean operators", "What is the output?", ["true", "false"], 0, "boolean A = true;\nboolean B = !A;\nboolean C = A || B;\nboolean D = B && C;\nboolean E = A ^ D;\nout.print(E);"),
      q("2024-district", "2024 District", 13, "Bitwise precedence", "What is the output?", ["10", "12", "14", "15", "16"], 4, "int M = 6 + 10 & 4 + 10 << 2;\nout.print(M);"),
      q("2025-district", "2025 District", 5, "Boolean and bitwise operators", "What is the output?", ["true", "false", "There is no output due to a syntax error"], 0, "boolean a = false;\nboolean b = true;\na |= !b & a ^ b & !a;\nout.println(a);"),
      q("2025-district", "2025 District", 8, "Bitwise operators", "What is the output?", ["101", "8", "36", "6", "There is no output due to a runtime error"], 1, "int a = 34 + 21 & 9;\nint b = a | 39 % 7;\na ^= b * 9 / 5;\nout.println(a);"),
      q("2026-district", "2026 District", 5, "Boolean logic", "What is the output?", ["truetruefalsefalse", "falsetruetruefalse", "truetruetruefalse", "falsetruefalsefalse", "falsefalsefalsefalse"], 0, "boolean a = true;\nboolean b = false;\nboolean c = true;\nboolean r1 = a && b || c;\nboolean r2 = a || b && !c;\nboolean r3 = a ^ c;\nboolean r4 = !(a && c) || b;\nout.println(r1 + \"\" + r2 + r3 + r4);"),
      q("2026-district", "2026 District", 7, "Bitwise operators", "What is the output?", ["89", "88", "90", "91", "88"], 0, "int a = 26 & 21 + 3;\nint b = 67 | 420 / 69;\na ^= b - 13 / 2;\nout.println(a);"),
    ],
  },
  {
    id: "binary-search-trees",
    title: "Binary Search Trees",
    description: "Practice traversals, tree height and width, leaves, internal nodes, diameter, and search complexity.",
    difficulty: "Hard",
    questions: [
      q("2022-region", "2022 Region", 35, "BST traversals", "The letters DBFCAGE are inserted into a binary search tree in order. Which traversal visits the nodes in the order DBFACEG?", ["Pre-order", "Post-order", "In-order", "Level-order", "None of the above"], 3),
      q("2023-invitational-a", "2023 Invitational A", 36, "BST leaves", "If these letters are inserted into an initially empty binary search tree, how many leaves will the resulting tree contain?", ["9", "10", "12", "1", "19"], 1, "A B C D E F G H I J J I H G F E D C B A"),
      q("2024-invitational-a", "2024 Invitational A", 36, "BST height", "Assume the BST using B, A, C has height 1. Insert the letters shown into an empty BST. Duplicate values go to the left of the original. What is the resulting height?", ["4", "5", "6", "7", "8"], 2, "U I L I N V I T A T I O N A L A"),
      q("2024-invitational-b", "2024 Invitational B", 32, "BST levels", "What is the minimum number of levels in a binary search tree containing 2,000 nodes?", ["8", "10", "11", "12", "1999"], 2),
      q("2025-invitational-a", "2025 Invitational A", 31, "BST internal nodes", "Assume duplicate values are not added. How many internal nodes will this unbalanced BST have?", ["15", "13", "10", "16", "9"], 4, undefined, "Insert in order: 34, 86, 28, 29, 33, 14, 52, 31, 92, 14, 15, 92, 31, 92, 105, 95, 97, 118."),
      q("2025-invitational-a", "2025 Invitational A", 32, "BST leaf nodes", "Using the same unbalanced BST, how many leaf nodes does it have?", ["1", "5", "3", "4", "7"], 1, undefined, "Insert in order: 34, 86, 28, 29, 33, 14, 52, 31, 92, 14, 15, 92, 31, 92, 105, 95, 97, 118."),
      q("2025-invitational-a", "2025 Invitational A", 33, "BST diameter", "Using the same unbalanced BST, what is its diameter?", ["8", "6", "9", "10", "4"], 2, undefined, "Insert in order: 34, 86, 28, 29, 33, 14, 52, 31, 92, 14, 15, 92, 31, 92, 105, 95, 97, 118."),
      q("2025-invitational-a", "2025 Invitational A", 34, "BST search complexity", "What is the worst-case time complexity of search in an unbalanced BST with n elements?", ["O(1)", "O(n²)", "O(n)", "O(√n)", "O(log n)"], 2, undefined, "Insert in order: 34, 86, 28, 29, 33, 14, 52, 31, 92, 14, 15, 92, 31, 92, 105, 95, 97, 118."),
      q("2023-district", "2023 District", 40, "BST leaves", "Build a binary search tree by inserting the letters in TRAMPOLINE in order. How many leaf nodes does it contain?", [], "2"),
      q("2024-district", "2024 District", 39, "BST leaves", "Insert A, E, I, O, U in that order, then insert the remaining consonants alphabetically from B through Z. How many leaves does the resulting BST have?", [], "5"),
    ],
  },
  {
    id: "inheritance-oop",
    title: "Inheritance & Object-Oriented Java",
    description: "Practice inheritance, constructors, fields, method dispatch, and compile-time access across related classes.",
    difficulty: "Hard",
    questions: [
      q("2022-region", "2022 Region", 25, "Inherited instance variables", "How many instance variables does a fish object have, counting the fields it inherits from pet?", ["0", "1", "2", "3", "4"], 2, "class pet {\n    private int weight;\n    private String name;\n    public pet(int w, String n) { this.weight = w; this.name = n; }\n}\nclass fish extends pet {\n    public fish(int w, String n) { super(w, n); }\n}"),
      q("2022-state", "2022 State", 27, "Inherited instance variables", "How many instance variables are part of a RedPanda object, including fields declared by Panda?", ["0", "1", "2", "3", "4"], 3, 'class Panda {\n    public String name;\n    public Panda() { this.name = "Jerry"; }\n}\nclass RedPanda extends Panda {\n    public String name;\n    public String color;\n}'),
      q("2023-state", "2023 State", 35, "Inheritance and access", "Which five client-code lines cause compiler errors?", ["4, 11, 14, 15, 16", "4, 11, 12, 14, 16", "4, 12, 14, 15, 16", "6, 7, 11, 12, 13", "6, 7, 10, 13, 16"], 1, undefined, 'class One {\n    private int A;\n    public int B;\n    public One(int Z) { A = Z; B = Z & (Z - 1); }\n    public int getA() { return A ^ (A - 1); }\n    public int getB() { return B & (B - 1); }\n}\nclass Two extends One {\n    private int A;\n    private int E;\n    public Two(int H, int G) { super(H * G); A = H; E = G; }\n    public int getB() { return B; }\n    public int getC() { return E; }\n}\nOne Alpha = new One(12);\nOne Beta = new Two(3, 4);\nTwo Gamma = new Two(12, 16);\nTwo Delta = new One(20);\n// Lines 5–16 call getA/getB/getC and access Gamma.A, Gamma.B, Gamma.E.'),
      q("2024-invitational-a", "2024 Invitational A", 32, "Constructors and fields", "What is output on line 1?", ["Bella", "Dylan", "BellaDylan", "DylanBella", "null"], 0, undefined, 'public class Mom {\n    public String Name;\n    public int ID;\n    public Mom() { Name = "Bella"; ID = 33; }\n}\npublic class Son extends Mom {\n    public String Name;\n    public Son(String St, int R) { super(); Name = St; }\n    public Son() { super(); ID = 44; }\n}\nMom A = new Mom();\nSon B = new Son("Dylan", 55);\nSon C = new Son();\nout.println(A.Name); // line 1\nout.println(B.ID);   // line 2\nout.println(C.ID);   // line 3'),
      q("2024-invitational-a", "2024 Invitational A", 33, "Constructors and fields", "Using the same Mom and Son code, what is output on line 2?", ["33", "44", "55", "77", "88"], 0, undefined, 'public class Mom { public String Name; public int ID; public Mom() { Name = "Bella"; ID = 33; } }\npublic class Son extends Mom { public String Name; public Son(String St, int R) { super(); Name = St; } public Son() { super(); ID = 44; } }\nMom A = new Mom(); Son B = new Son("Dylan", 55); Son C = new Son();\nout.println(A.Name); // line 1\nout.println(B.ID); // line 2\nout.println(C.ID); // line 3'),
      q("2024-invitational-a", "2024 Invitational A", 34, "Constructors and fields", "Using the same Mom and Son code, what is output on line 3?", ["33", "44", "55", "77", "88"], 1, undefined, 'public class Mom { public String Name; public int ID; public Mom() { Name = "Bella"; ID = 33; } }\npublic class Son extends Mom { public String Name; public Son(String St, int R) { super(); Name = St; } public Son() { super(); ID = 44; } }\nMom A = new Mom(); Son B = new Son("Dylan", 55); Son C = new Son();\nout.println(A.Name); // line 1\nout.println(B.ID); // line 2\nout.println(C.ID); // line 3'),
      q("2025-district", "2025 District", 24, "Superclass constructors", "What can replace <1*> so class B compiles and behaves as intended?", ["this.y = n * 2; y = n;", "super(n * 2, n);", "super(n * 2); y = n;", "super(n * 2); super(n);", "More than one of the above"], 2, undefined, district2025InheritanceContext),
      q("2025-district", "2025 District", 25, "Superclass constructors and dispatch", "Assuming the constructor blank is correctly filled, what is output on line q25?", ["3 8", "3 4", "6 8", "6 4", "There is no output due to a compile error"], 0, undefined, district2025InheritanceContext),
      q("2025-district", "2025 District", 26, "Method dispatch", "Assuming earlier errors are corrected, what is output on line q26?", ["8", "10", "Output cannot be determined until runtime", "There is no output due to a compile error", "There is no output due to a runtime error"], 2, undefined, district2025InheritanceContext),
      q("2025-district", "2025 District", 27, "Compile-time method access", "Assuming earlier errors are corrected, what happens on line q27?", ["12", "13", "Output cannot be determined until runtime", "There is no output due to a compile error", "There is no output due to a runtime error"], 3, undefined, district2025InheritanceContext),
    ],
  },
  {
    id: "regular-expressions",
    title: "Regular Expressions (Regex)",
    description: "Practice Java String.matches, character classes, anchors, repetition, escapes, and combining patterns.",
    difficulty: "Hard",
    questions: [
      q("2022-district", "2022 District", 35, "Regex anchors", "Which symbol denotes the beginning of a line in a regular expression?", ["%", "$", "^", "\\b", "None of the above"], 2),
      q("2022-region", "2022 Region", 39, "Regex character classes", "How many unique strings can replace CODE so both matches calls return true?", [], "4", undefined, 'String A = "[ABC]{1,2}";\nString B = "[BCD]{2,3}";\nString C = /* CODE */;\nout.print(C.matches(A) && C.matches(B));'),
      q("2022-state", "2022 State", 40, "Regex quantifiers", "Give one String value for S that makes all three matches calls return true.", [], "AAAABCCC", undefined, 'String A = "A{1,5}B{1,5}C{1,5}";\nString B = ".*ABC*";\nString C = "....B...";\nString S = /* your value */;\nboolean x = S.matches(A);\nboolean y = S.matches(B);\nboolean z = S.matches(C);\nout.println(x && y && z);'),
      q("2023-region", "2023 Region", 37, "Regex wildcards and classes", "How many of the matches checks are true?", ["1", "2", "3", "4", "5"], 1, 'int C = 0;\nString A = "R2 - D2";\nif (A.matches(".....")) C++;\nif (A.matches(".2.2")) C++;\nif (A.matches("[A-T]*")) C++;\nif (A.matches("2.*")) C++;\nif (A.matches(".*2")) C++;\nif (A.matches(".*[0-9].*[0-9]")) C++;\nout.print(C);'),
      q("2023-state", "2023 State", 23, "Regex with Scanner", "What value is printed?", ["4", "6", "8", "10", "12"], 0, 'String St = "BEAR OWL DOG CAT LION ";\nSt += "ZEBRA RAT PIG TIGER GORILLA";\nint N = 0;\nScanner Sue = new Scanner(St);\nwhile (Sue.hasNext()) {\n    Sue.next();\n    String A = Sue.next();\n    if (A.matches("..O.")) N++;\n    if (A.matches("[A-C].*")) N++;\n    if (A.matches("..G")) N++;\n    if (A.matches(".*R.*")) N++;\n}\nout.print(N);'),
      q("2024-invitational-b", "2024 Invitational B", 23, "Regex character classes", "What is the output after the loop removes matching letters?", ["22", "23", "24", "25", "26"], 0, 'String Q = "ABCDEFGHIJKLM";\nString R = "NOPQRSTUVWXYZ";\nString T = R + Q;\nfor (int x = 0; x < T.length(); x++) {\n    String Z = T.substring(x, x + 1);\n    if (Z.matches("[TEXAS]")) T = T.substring(0, x) + T.substring(x + 1);\n}\nout.print(T.length());'),
      q("2024-state", "2024 State", 24, "Regex prefixes", "What is printed after the matching suffixes are removed?", ["RSITY", "VERSITY", "VERSIT", "TY", "RIT"], 0, 'ArrayList<String> Starsky = new ArrayList<String>();\nString Hutch = "UNIVERSITY";\nfor (int x = 0; x < Hutch.length(); x++) Starsky.add(Hutch.substring(x));\nfor (int x = 0; x < Starsky.size(); x++) {\n    String A = Starsky.get(x);\n    if (A.matches("[AEIOU].*")) Starsky.remove(x);\n}\nout.print(Starsky.get(2));'),
      q("2025-invitational-a", "2025 Invitational A", 28, "Regex repetition and whitespace", "What is the output?", ["true", "false", "Output cannot be determined until runtime", "There is no output due to a compile error", "There is no output due to a runtime error"], 0, 'String s1 = "H3llo Th3r3!";\nString s2 = "H..{2,4} \\\\S..{2,5}";\nout.println(s1.matches(s2));'),
      q("2025-invitational-b", "2025 Invitational B", 28, "Regex alternatives", "What is the output?", ["true true", "false true", "true false", "false false", "There is no output due to a runtime error"], 1, 'String s = "Luke Skywalker";\nString fin = "";\nString r = "(\\\\w)+|(\\\\s){0,3}";\nfin += s.matches(r) + " ";\nr = "([A-z]+ ?)*";\nfin += s.matches(r);\nout.println(fin);'),
      q("2026-district", "2026 District", 31, "Regex groups and negated classes", "What is the output?", ["false false", "false true", "true false", "true true", "There is no output due to a compile error"], 1, 'String str = "BEEPbeepONtheSTREET";\nString reg = "([A-Z]+[a-z]+)*|((\\\\w\\\\w)+)+";\nout.print(str.matches(reg) + " ");\nreg = "\\\\w\\\\D{10,17}....";\nout.println(str.matches(reg));'),
    ],
  },
  {
    id: "print-formatting",
    title: "Print Formatting: print, println & printf",
    description: "Trace exact output with print, println, printf format specifiers, rounding, field widths, escapes, and line breaks.",
    difficulty: "Easy",
    questions: [
      q("2022-district", "2022 District", 3, "Rounding and line breaks", "What is the output?", ["PI\n3.14Pie", "Pi\n3.141Pie", "Pi\n3.142Pie", "Pi\n3.141\nPie", "Pi\n3.142\nPie"], 2, 'out.println("Pi");\nout.printf("%.3f", 3.14159);\nout.println("Pie");'),
      q("2022-invitational-a", "2022 Invitational A", 3, "Width and precision", "What is printed?", ["002.34", "02.34", "02.35", "002.35", "None of the above"], 2, 'out.printf("%05.2f", 2.345);'),
      q("2022-region", "2022 Region", 3, "Escaped percent signs", "What is printed?", ["%%%%2.72", "%%2.72", "2.72", "%%%%2.7", "There is no output due to a compile error"], 1, 'out.printf("%%%%%.2f", 2.718);'),
      q("2022-state", "2022 State", 7, "Integer and decimal formatting", "What is printed?", ["3.00", "3.50", "3.78", "4.28", "There is no output due to an error"], 2, 'int x = 7;\ndouble y = 9.0;\nout.printf("%.2f", x / 2 + x / y);'),
      q("2023-district", "2023 District", 3, "Line breaks and rounded decimals", "What is the output?", ["5.6\nFive\nSixSeven\nEight", "5.6Five\nSixSeven\nEight", "5.7Five\nSixSeven\nEight", "5.7\nFive\nSixSevenEight", "5.7\nFive\nSixSeven\nEight"], 4, 'double A = 5.678;\nout.printf("%.1f\\n", A);\nout.print("Five\\nSix");\nout.println("Seven\\nEight");'),
      q("2023-state", "2023 State", 3, "Integer, decimal, and character formats", "What is printed?", ["68-13.60-c", "68-13.00-c", "68-13.60-D", "68-13.00-D", "54.40-D"], 3, 'int May = 68;\ndouble State = May / 5;\nString St = "%d-%.2f-%c";\nout.printf(St, May, State, May);'),
      q("2025-district", "2025 District", 3, "Uppercase and field width", "What is printed?", ["abcde", "abc", "ABCDE", "ABC", "There is no output due to a runtime error"], 2, 'out.printf("%3S", "abcde");'),
      q("2025-region", "2025 Region", 3, "Boolean format specifier", "What is printed?", ["true", "false", "TRUE", "FALSE", "There is no output due to a runtime error"], 2, 'out.printf("%B", -17);'),
      q("2025-state", "2025 State", 3, "Argument indexing and conversions", "What is printed?", ["1.2YEPZ", "1.2YepY", "1.3YEPY", "1.3YepZ", "There is no output due to a runtime error"], 2, 'String s = "Yep";\nint i = 89;\ndouble d = 1.25;\nout.printf("%3$.1f%1$S%2$c", s, i, d);'),
      q("2026-invitational-a", "2026 Invitational A", 3, "Decimal precision and rounding", "What is printed?", ["x = 5, y = 2.8", "x = 5, y = 2.7", "x = 5, y = 2.75", "x = %d, y = %.1f", "There is no output due to an error"], 0, 'out.printf("x = %d, y = %.1f\\n", 5, 2.75);'),
    ],
  },
];
