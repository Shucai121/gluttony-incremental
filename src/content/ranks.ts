export const RANKS: readonly string[] = ["E", "D", "C", "B", "A", "S"];

// Rank-up thresholds on cumulative Sin Essence (SPEC §6). Index aligns with RANKS.
export const RANK_THRESHOLDS: string[] = ["0", "50", "5e3", "5e5", "1e8", "1e12"];

// rankMult = RANK_MULT_BASE ^ devourerRank
export const RANK_MULT_BASE = "3";
