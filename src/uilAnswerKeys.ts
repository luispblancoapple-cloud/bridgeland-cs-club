// Official answer keys transcribed from the answer-key pages in the UIL packets.
// Entries are ordered by question number; the final two are the written responses.
const key = (q1to30: string, q31to38: string, q39: string, q40: string) =>
  [...q1to30.trim().split(/\s+/), ...q31to38.trim().split(/\s+/), q39, q40];

export const UIL_ANSWER_KEYS: Record<string, string[]> = {
  "2026-invitational-a": key("A E A C B B D D E B E A D D B A D A B B B C B D D B D C C C", "A D A E E E D B", "5", "8"),
  "2026-invitational-b": key("861 E B D A C D A E B C A C B E D A C E D B D C H F B C C F A", "F B C F C B D C", "10111101", "19"),
  "2026-district": key("E B C D A B A C A D A B C D A A B B C B F B D D C E D C B C", "B D E C D C E E", "4", "12"),
  "2026-region": key("B D B E B A D D E A D B A C A A A B A E C D A D H B C A E C", "D D C B E B C A", "26", "10"),
  "2026-state": key("A D B C A C C A E B D A A A D D C D A D E A E C B D D C D D", "D B A C B B C A", "13", "2"),

  "2025-invitational-a": key("E D A C A C A D C A D A A D C A D D C A A B C B C A B A D D", "E B C C A D C D", "-103", "A D F C G A"),
  "2025-invitational-b": key("D B C C C B E E A C B D B D C A B E D B A B C A B A D B C D", "B B A A B C E C", "10011001", "1 6 8 9 17 29 34 48 67 97 104 147 212"),
  "2025-district": key("E C C D A D B B D A C B D A C B E A D D A D C C A C D J C B", "C C D B B A C E", "n log n", "(A+(B-C))*(D/(E-(F+G)))"),
  "2025-region": key("C A C B A D D C B C A A E B D D G K B A B A D D A C D B C A", "D A E D A A A C", "E log V||E log E||V^2 log V||(V+E) log V||V^2", "171"),
  "2025-state": key("B C B A B B D C A D E B E A C C B A D C B A B A C G B B D D", "C D C E D E E E", "9,1,19,4", "86"),

  "2024-invitational-a": key("B D C C A D B E A B A D B C B A B B D A B D A C D D A A D E", "D A A B B C B E", "32", "14"),
  "2024-invitational-b": key("D C C B A B E D A B B D A A E B A C C B C D A E E A D B D A", "C C A A C E B E", "4", "7"),
  "2024-district": key("D A D A A B B D D C D D E D C D B E A E C D D B A E E C A D", "D D E A D A E E", "5", "63"),
  "2024-region": key("C D A C A D B C E B D A C D D D D C A B D D B D D F H A C A", "D C A D E B B C", "31", "67"),
  "2024-state": key("A B D A C C E B C E E B A C A A D C B E A B E A C D C B C D", "D B C A C A C A", "30", "2"),

  "2023-invitational-a": key("B D A B A D B D E E D A D C C E E E A D C C B A D A D C C A", "D E D D D B D B", "G", "4"),
  "2023-invitational-b": key("C D A E B A C E C A D B E C D A B E D D A D E A D B A B D E", "D B B E C C E E", "28", "192"),
  "2023-district": key("A B E E A E C C A D B A D C E B D D A A B E D C C D B A D E", "E B D D C A C B", "81", "2"),
  "2023-region": key("D A B C B B D D A D D C B E A B A C E A C E B C B B D C E E", "C E D B C E C B", "10", "512"),
  "2023-state": key("D B D A A A E B E C D C A C B D A B E A B D A A C B C E D D", "C B E A B B D A", "10", "10"),

  "2022-invitational-a": key("B D C D B D B B B A C B B C C D E A B B B B B C C B B E C B", "A A C C D E D C", "2", "10000000"),
  "2022-invitational-b": key("D D A D B D B B B A C B D D C D C D A A D C E C A B A E A B", "C C B D A D C D", "0", "01111111"),
  "2022-district": key("D A C C B C D A C B B C E C B B E B D A A B C D B C B A C D", "C D D C B B C E", "17", "12"),
  "2022-region": key("B D B D B C A C D D E C D A B A D B D A D C E E C A B E B B", "B E B D D C C D", "4", "11"),
  "2022-state": key("E B D D B E C C D A B D B B A A B E C C A C B C D C D B B A", "C C A E C A D B", "45", "AAAABCCC"),
};
