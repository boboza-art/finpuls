// ============================================================
// 编辑推荐理由自动生成引擎
// 基于标签、热度、事件类型、信源特征自动生成推荐理由
// ============================================================

import type { NewsItem } from "./types";

// ============================================================
// 推荐理由模板库
// 每个模板是一个函数，根据条目特征返回推荐理由文本
// ============================================================

type NoteTemplate = (item: NewsItem, ctx: NoteContext) => string | null;

interface NoteContext {
  sourceCount: number; // 信源总数
  heatScore: number;
  ageHours: number;
  isMultiCompany: boolean; // 涉及多家公司
}

// ----- 财报模板 -----
const earningsTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("财报")) return null;
  const company = item.relatedStocks?.[0];
  const direction = item.tags.includes("看多") ? "超预期" : item.tags.includes("看空") ? "不及预期" : "关注数据";

  if (ctx.heatScore >= 85) {
    return `${company || "该公司"}财报${direction}，热度极高（${ctx.sourceCount} 个信源同时报道）。财报是基本面验证的关键节点，数据可信度高于分析师预期。持有者可继续持有，未持仓者关注回调机会。`;
  }
  return `${company || "该公司"}财报${direction}，需关注营收增速和下季度指引。财报后的盘后波动通常较大，建议等开盘 30 分钟后再做交易决策。`;
};

// ----- 产品发布模板 -----
const productLaunchTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("产品发布")) return null;
  const company = item.relatedStocks?.[0] || item.relatedCryptos?.[0];
  const isAI = item.tags.includes("AI");

  if (isAI) {
    return `${company || "该产品"}的 AI 能力升级，是行业技术趋势的关键节点。关注落地场景和用户留存数据——技术领先不等于商业成功。`;
  }
  if (ctx.heatScore >= 80) {
    return `${company || "该"}产品发布引发广泛关注（${ctx.sourceCount} 个信源报道）。产品发布的短期市场反应通常偏情绪化，长期价值取决于实际销量和用户反馈。`;
  }
  return `${company || "该"}产品发布，关注供应链和定价策略对毛利率的影响。`;
};

// ----- 监管/SEC 模板 -----
const regulationTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("监管") && !item.sourceName.toLowerCase().includes("sec")) return null;
  const crypto = item.relatedCryptos?.[0];

  if (crypto) {
    return `${crypto} 面临监管事件，${ctx.sourceCount} 个信源报道。监管是加密资产最大不确定性——利空兑现常是底部信号，但需区分"罚款"和"禁止运营"的本质差异。`;
  }
  return `监管事件涉及 ${item.relatedStocks?.[0] || "相关公司"}，需评估罚款规模相对营收的比例和合规监控的长期成本。一次性罚款通常不会改变长期基本面。`;
};

// ----- ETF 模板 -----
const etfTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("ETF")) return null;
  const crypto = item.relatedCryptos?.[0];

  if (crypto) {
    return `${crypto} 现货 ETF 是机构资金入场的合规通道。ETF 获批 = 监管层接受该资产为商品，这是结构性利好。但需警惕"利好兑现即回调"——真实需求需观察首周净流入数据，而非首日情绪。`;
  }
  return `ETF 相关动态，${ctx.sourceCount} 个信源报道。关注资金流向和费率竞争。`;
};

// ----- 巨鲸异动模板 -----
const whaleTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("巨鲸异动")) return null;
  const crypto = item.relatedCryptos?.[0];

  return `${crypto || "该资产"}链上巨鲸异动被 ${ctx.sourceCount} 个信源追踪。交易所转出 = 中长期持有意图，是经典看多信号。但单笔数据不足以判断趋势，需结合 7 天交易所净流入数据综合判断。`;
};

// ----- 看多/看空情绪模板 -----
const sentimentTemplate: NoteTemplate = (item, ctx) => {
  const isBull = item.tags.includes("看多");
  const isBear = item.tags.includes("看空");
  if (!isBull && !isBear) return null;

  const asset = item.relatedStocks?.[0] || item.relatedCryptos?.[0] || "该资产";

  if (isBull && ctx.heatScore >= 85) {
    return `${asset} 看多信号强烈（热度 ${ctx.heatScore}），${ctx.sourceCount} 个信源报道。但市场共识过强时需警惕"共识即见顶"——反向指标值得关注。`;
  }
  if (isBear && ctx.heatScore >= 85) {
    return `${asset} 看空信号强烈（热度 ${ctx.heatScore}）。恐慌性下跌通常是短期底部，但需区分"恐慌"和"基本面恶化"。`;
  }
  return isBull
    ? `${asset} 短期偏多，关注量能配合。`
    : `${asset} 短期偏空，注意支撑位。`;
};

// ----- 收购模板 -----
const acquisitionTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("收购")) return null;
  return `收购事件涉及 ${item.relatedStocks?.[0] || "相关公司"}，${ctx.sourceCount} 个信源报道。收购溢价和整合协同效应是关键——大多数收购在 3 年后未能创造价值，关注交易对价和业绩承诺。`;
};

// ----- 高热度通用模板 -----
const highHeatGenericTemplate: NoteTemplate = (item, ctx) => {
  if (ctx.heatScore < 85) return null;
  const asset = item.relatedStocks?.[0] || item.relatedCryptos?.[0];

  if (ctx.sourceCount >= 10) {
    return `${asset || "该事件"}引发 ${ctx.sourceCount} 个信源广泛报道，热度 ${ctx.heatScore}。高共识事件通常意味着信息已被市场定价，寻找边际增量信息比追逐共识更重要。`;
  }
  return `${asset || "该事件"}热度 ${ctx.heatScore}，值得关注后续发展。`;
};

// ----- 快讯模板 -----
const breakingTemplate: NoteTemplate = (item, ctx) => {
  if (!item.tags.includes("快讯")) return null;
  if (ctx.ageHours < 2) {
    return `突发快讯，${ctx.sourceCount} 个信源报道。快讯的短期波动通常在 2 小时内消化，建议等更多细节确认后再行动。`;
  }
  return null;
};

// ----- 通用模板 -----
const genericTemplate: NoteTemplate = (item, ctx) => {
  const asset = item.relatedStocks?.[0] || item.relatedCryptos?.[0];
  if (asset) {
    return `${asset} 相关动态，${ctx.sourceCount} 个信源报道。关注事件对基本面和估值的影响。`;
  }
  return `值得关注的市场动态，${ctx.sourceCount} 个信源报道。`;
};

// ============================================================
// 模板优先级（从高到低）
// ============================================================

const TEMPLATES: NoteTemplate[] = [
  breakingTemplate,        // 快讯最优先
  earningsTemplate,       // 财报
  regulationTemplate,     // 监管
  etfTemplate,            // ETF
  acquisitionTemplate,    // 收购
  whaleTemplate,          // 巨鲸异动
  productLaunchTemplate,  // 产品发布
  sentimentTemplate,      // 情绪
  highHeatGenericTemplate,// 高热度通用
  genericTemplate,        // 通用兜底
];

// ============================================================
// 主入口：生成推荐理由
// ============================================================

export function generateNote(item: NewsItem): string {
  const sourceCount = (item.additionalSources?.length || 0) + 1;
  const ageHours = (Date.now() - item.publishedAt) / (60 * 60 * 1000);
  const ctx: NoteContext = {
    sourceCount,
    heatScore: item.heatScore,
    ageHours,
    isMultiCompany: (item.relatedStocks?.length || 0) > 1,
  };

  for (const template of TEMPLATES) {
    const note = template(item, ctx);
    if (note) return note;
  }

  return "值得关注的市场动态。";
}

/**
 * 批量为没有推荐理由的条目生成理由
 */
export function generateNotesForItems(items: NewsItem[]): NewsItem[] {
  return items.map((item) => ({
    ...item,
    note: item.note || generateNote(item),
  }));
}
