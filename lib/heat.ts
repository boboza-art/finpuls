// ============================================================
// 热度评分算法
// 综合因素：信源权重 × 信源数量 × 时效性 × 事件类型加权
// ============================================================

/**
 * 计算热度评分 (0-100)
 *
 * @param sourceWeight 主信源权重 (0-100)
 * @param sourceCount 报道信源总数
 * @param publishedAt 发布时间戳
 * @param hasBreaking 是否快讯
 * @param hasEarnings 是否财报
 * @param hasSEC 是否 SEC 公告
 */
export function calculateHeatScore(params: {
  sourceWeight: number;
  sourceCount: number;
  publishedAt: number;
  isBreaking?: boolean;
  isEarnings?: boolean;
  isSEC?: boolean;
}): number {
  const { sourceWeight, sourceCount, publishedAt, isBreaking, isEarnings, isSEC } = params;

  // 基础分：信源权重
  let score = sourceWeight * 0.4;

  // 信源数量加权（对数增长，避免过多信源导致分数爆炸）
  // 1 个信源 = +5, 5 个 = +15, 10 个 = +20, 20 个 = +25
  score += Math.min(25, Math.log2(sourceCount + 1) * 7);

  // 时效性衰减：24 小时内满分，72 小时后衰减
  const ageHours = (Date.now() - publishedAt) / (60 * 60 * 1000);
  if (ageHours < 6) {
    score += 20; // 6 小时内 +20
  } else if (ageHours < 24) {
    score += 15; // 24 小时内 +15
  } else if (ageHours < 48) {
    score += 10; // 48 小时内 +10
  } else if (ageHours < 72) {
    score += 5; // 72 小时内 +5
  }

  // 事件类型加权
  if (isSEC) score += 10; // SEC 公告
  if (isEarnings) score += 8; // 财报
  if (isBreaking) score += 5; // 快讯

  // 限制在 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

