export const MCP_COLORS = ['#f97316', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6'] as const;

export function mcpColorAt(index: number): string {
  return MCP_COLORS[index % MCP_COLORS.length] ?? MCP_COLORS[0];
}
