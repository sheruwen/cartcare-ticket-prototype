import { useRef, useState } from "react";
import { agents, cases as initialCases, techTickets as initialTechTickets, timelineEvents, transactions } from "./mockData";
import type { CaseStatus, CaseType, CartPointsTransaction, Priority, SupportCase, TechTicket, TimelineEvent } from "./types";

type Page = "cases" | "dashboard" | "kb" | "settings";
type Toast = { id: number; text: string };
type AppRole = "一線客服" | "二線客服" | "客服主管";
type UserProfile = { id: string; name: string; role: AppRole };
type ProjectArea = "tw" | "sea";
type Locale = "zh" | "en";

const statuses: CaseStatus[] = ["新建立", "待受理", "處理中", "待顧客回覆", "待二線客服處理", "待技術支援", "技術排查中", "已解決", "已結案", "已關閉", "已取消"];
const closeReasons = [
  { zh: "顧客取消需求", en: "Customer canceled the request" },
  { zh: "重複案件", en: "Duplicate ticket" },
  { zh: "建立錯誤", en: "Created by mistake" },
  { zh: "顧客未回覆", en: "Customer did not respond" },
  { zh: "非客服處理範圍", en: "Outside support scope" },
  { zh: "其他", en: "Other" },
];
const caseTypes: CaseType[] = ["帳號問題", "訂單問題", "退款問題", "CartPoints 點數問題", "系統問題", "其他"];
const priorities: Priority[] = ["低", "中", "高", "緊急"];
const subtypeOptionsByType: Record<CaseType, string[]> = {
  帳號問題: ["登入異常", "會員資料異常", "帳號停用", "安全驗證"],
  訂單問題: ["訂單狀態異常", "優惠折抵", "物流進度", "付款狀態"],
  退款問題: ["退款進度", "退款金額異常", "金流同步", "退款失敗"],
  "CartPoints 點數問題": ["點數餘額異常", "點數未入帳", "點數轉讓延遲", "點數轉讓失敗", "點數交易紀錄異常", "點數遭未授權使用"],
  系統問題: ["前台查詢異常", "頁面載入異常", "通知異常", "系統同步異常"],
  其他: ["一般諮詢", "資料補充", "重複來信", "其他"],
};
const users: UserProfile[] = [
  { id: "a1", name: "林佳蓉", role: "一線客服" },
  { id: "a2", name: "陳冠宇", role: "二線客服" },
  { id: "a4", name: "張柏翰", role: "二線客服" },
  { id: "lead", name: "王美玲", role: "客服主管" },
];
const statusDescriptions: Record<CaseStatus, string> = {
  新建立: "系統剛建立案件，尚未進入客服 queue",
  待受理: "消費者剛送出案件，尚未有客服接案",
  處理中: "客服已接案並正在處理",
  待顧客回覆: "等待消費者補充資訊或確認",
  待二線客服處理: "已升級案件，等待二線客服接手",
  待技術支援: "已建立或關聯技術工單，等待技術支援",
  技術排查中: "技術團隊正在排查",
  已解決: "問題已處理完成，等待確認或自動結案",
  已結案: "案件已完成並封存",
  已關閉: "案件已停止處理，並已記錄關閉原因",
  已取消: "誤開案件或重複案件",
};
const statusGroups: Array<{ label: string; options: CaseStatus[] }> = [
  { label: "接案流程", options: ["新建立", "待受理", "處理中", "待顧客回覆"] },
  { label: "協作流程", options: ["待二線客服處理", "待技術支援", "技術排查中"] },
  { label: "完成流程", options: ["已解決", "已結案", "已關閉", "已取消"] },
];
const i18n = {
  zh: {
    platform: "內部客服作業平台",
    currentUser: "目前使用者",
    ticketListSection: "案件列表",
    operations: "營運工具",
    supportSettings: "支援設定",
    dashboard: "客服營運總覽",
    techTickets: "技術工單",
    knowledgeBase: "知識庫",
    settings: "設定",
    language: "語言",
    taiwanProject: "台灣地區客服專案",
    seaProject: "東南亞地區客服專案",
    taiwanCenter: "台灣地區案件中心",
    seaCenter: "東南亞地區案件中心",
    allOpen: "全部未結案件",
    starred: "常用佇列",
    teamPriority: "團隊優先",
    searchPlaceholder: "搜尋 User ID、Email、姓名、案號或案件主題",
    searchHint: "可用 User ID 或 Email 查找該顧客的案件",
    searchResult: (count: number) => `符合 ${count} 件`,
    clear: "清除",
    visibleCount: (filtered: number, visible: number) => `${filtered} / ${visible} 件`,
    status: "狀態",
    type: "類型",
    priority: "優先級",
    assignee: "負責人",
    cartpoints: "CartPoints",
    overdue: "超時",
    all: "全部",
    yes: "是",
    no: "否",
    ticketId: "案號",
    subject: "案件主題",
    title: "案件標題",
    customer: "顧客",
    deadline: "SLA",
    lastUpdated: "最後更新",
    mine: "我的待處理",
    newCases: "未指派案件",
    deadlineRisk: "結案期限風險",
    waitingCustomer: "待顧客回覆",
    frontlineCartPoints: "CartPoints 一般",
    secondLine: "待二線處理",
    manualPoints: "點數人工確認",
    techQueue: "待技術",
    highPriority: "高優先級",
    myTech: "關聯技術案件",
    techCases: "待技術支援案件",
    verifying: "待驗證",
    multiLinked: "多案件關聯",
    overdueCases: "超時案件",
  },
  en: {
    platform: "Internal support workspace",
    currentUser: "Current user",
    ticketListSection: "Ticket queues",
    operations: "Operations",
    supportSettings: "Support settings",
    dashboard: "Support Operations",
    techTickets: "Linked external tickets",
    knowledgeBase: "Knowledge base",
    settings: "Settings",
    language: "Language",
    taiwanProject: "Taiwan Service Desk",
    seaProject: "Southeast Asia Service Desk",
    taiwanCenter: "Taiwan Ticket Center",
    seaCenter: "Southeast Asia Ticket Center",
    allOpen: "All open tickets",
    starred: "STARRED",
    teamPriority: "TEAM PRIORITY",
    searchPlaceholder: "Search by User ID, email, name, ticket ID, or subject",
    searchHint: "Use User ID or email to find this customer's tickets",
    searchResult: (count: number) => `${count} matching tickets`,
    clear: "Clear",
    visibleCount: (filtered: number, visible: number) => `${filtered} / ${visible} tickets`,
    status: "Status",
    type: "Type",
    priority: "Priority",
    assignee: "Assignee",
    cartpoints: "CartPoints",
    overdue: "Overdue",
    all: "All",
    yes: "Yes",
    no: "No",
    ticketId: "Key",
    subject: "Summary",
    title: "Title",
    customer: "Customer",
    deadline: "SLA",
    lastUpdated: "Updated",
    mine: "My open tickets",
    newCases: "Unassigned",
    deadlineRisk: "Closure risk",
    waitingCustomer: "Waiting for customer",
    frontlineCartPoints: "CartPoints standard",
    secondLine: "Second-line queue",
    manualPoints: "Manual points review",
    techQueue: "Waiting for engineering",
    highPriority: "High priority",
    myTech: "Linked external tickets",
    techCases: "Waiting for technical support",
    verifying: "Waiting for verification",
    multiLinked: "Multi-ticket links",
    overdueCases: "Overdue tickets",
  },
};
const seaCaseDisplay: Record<string, Partial<SupportCase>> = {
  "CC-2026-0002": {
    title: "My order says shipped but I have not received it",
    customerName: "Alyssa Tan",
    email: "alyssa.tan@example.test",
    subtype: "Order status mismatch",
  },
  "CC-2026-0004": {
    title: "My CartPoints may have been transferred without permission",
    customerName: "Nur Aisyah",
    email: "nur.aisyah@example.test",
    subtype: "Unauthorized points usage",
  },
  "CC-2026-0005": {
    title: "The campaign points I received look incorrect",
    customerName: "Minh Nguyen",
    email: "minh.nguyen@example.test",
    subtype: "Points not credited correctly",
  },
  "CC-2026-0006": {
    title: "I cannot see my points history in member center",
    customerName: "Kanya Wirat",
    email: "kanya.wirat@example.test",
    subtype: "Frontend history loading issue",
  },
  "CC-2026-0008": {
    title: "My points balance does not match my transaction history",
    customerName: "Daniel Lim",
    email: "daniel.lim@example.test",
    subtype: "Balance mismatch",
  },
};

const seaTypeLabels: Record<CaseType, string> = {
  帳號問題: "Account issue",
  訂單問題: "Order issue",
  退款問題: "Refund issue",
  "CartPoints 點數問題": "CartPoints issue",
  系統問題: "System issue",
  其他: "Other",
};

const subtypeLabelsEn: Record<string, string> = {
  訂單狀態異常: "Order status mismatch",
  退款進度: "Refund progress",
  點數餘額異常: "Balance mismatch",
  點數未入帳: "Points not credited",
  點數轉讓延遲: "Points transfer delay",
  點數轉讓失敗: "Points transfer failed",
  點數交易紀錄異常: "Transaction history mismatch",
  點數遭未授權使用: "Unauthorized points usage",
  前台查詢異常: "Frontend lookup issue",
  優惠折抵: "Discount redemption",
};

const seaAgentNames: Record<string, string> = {
  林佳蓉: "Grace Lin",
  陳冠宇: "Kevin Chen",
  吳雅婷: "Yating Wu",
  張柏翰: "Brian Chang",
  未指派: "Unassigned",
  系統: "System",
  外部系統同步: "External sync",
  一線客服: "Frontline Support",
};

const seaRoleLabels: Record<string, string> = {
  一線客服: "Frontline Support",
  二線客服: "Second-line Support",
  客服主管: "Support Manager",
  未分組: "Unassigned",
};

const statusLabelsEn: Record<CaseStatus, string> = {
  新建立: "New",
  待受理: "Pending intake",
  處理中: "In progress",
  待顧客回覆: "Waiting for customer",
  待二線客服處理: "Waiting for second-line",
  待技術支援: "Waiting for engineering",
  技術排查中: "Engineering investigation",
  已解決: "Resolved",
  已結案: "Closed",
  已關閉: "Closed",
  已取消: "Canceled",
};

const priorityLabelsEn: Record<Priority, string> = {
  低: "Low",
  中: "Medium",
  高: "High",
  緊急: "Urgent",
};

const transactionStatusLabelsEn: Record<string, string> = {
  處理中: "Processing",
  已完成: "Completed",
  失敗: "Failed",
  逾時: "Timed out",
  需人工確認: "Manual review",
};

const transactionTypeLabelsEn: Record<string, string> = {
  點數轉入: "Points credit",
  點數轉出: "Points debit",
  點數轉讓: "Points transfer",
  活動入帳: "Campaign credit",
  退款回補: "Refund adjustment",
};

const eventTypeLabelsEn: Record<string, string> = {
  案件建立: "Ticket created",
  一線客服接案: "Frontline owner assigned",
  補全案件資訊: "Ticket details updated",
  使用CartPoints排查工具: "CartPoints lookup used",
  "使用 CartPoints 排查工具": "CartPoints lookup used",
  附加查詢摘要: "Lookup summary added",
  升級至二線客服: "Transferred to second-line",
  建立技術工單: "External ticket created",
  關聯技術工單: "External ticket linked",
  關聯既有技術工單: "External ticket linked",
  技術工單狀態更新: "External ticket updated",
  回覆顧客: "Customer reply sent",
  公開回覆: "Customer reply sent",
  新增內部備註: "Comment added",
  二線處理結果: "Second-line analysis",
  二線分析完成: "Second-line analysis completed",
  接案: "Ownership accepted",
  狀態更新: "Status updated",
  指派變更: "Owner changed",
  優先級調整: "Priority updated",
  結案: "Ticket closed",
};

const uiText = {
  zh: {
    expandSidebar: "展開左側選單",
    collapseSidebar: "收合左側選單",
    userMenu: "使用者選單",
    systemName: "客服工單系統",
    openTabs: "已開啟案件分頁",
    close: "關閉",
    filter: "篩選",
    queue: {
      myWork: "我的工作",
      secondLineWork: "二線工作",
      risk: "高風險案件",
      special: "特殊案件",
      all: "全部案件",
      mine: "我的待處理",
      mineDesc: "目前指派給我的未結案件",
      waiting: "待顧客回覆",
      waitingDesc: "等待顧客補件或確認",
      escalated: "已升級待追蹤",
      escalatedDesc: "已升級二線，需追蹤交接",
      secondMine: "我的案件",
      secondMineDesc: "目前由我擔任 Owner 的案件",
      secondQueue: "待二線客服處理 Queue",
      secondQueueDesc: "未指派 Owner，二線可自行接案",
      needTech: "待技術支援案件",
      needTechDesc: "已建立或等待外部技術工單回覆",
      dueSoon: "即將超時",
      dueSoonDesc: "24 小時內到期，需優先處理",
      overdue: "已超時",
      overdueDesc: "已超過結案期限，需立即處理",
      cpAbnormal: "CartPoints 異常案件",
      cpStandard: "CartPoints 一般案件",
      cpAbnormalDesc: "需二線分析的 CartPoints 異常",
      cpStandardDesc: "由我負責的 CartPoints 案件",
      tech: "待技術支援",
      techDesc: "正在等待技術團隊回覆",
      allOpen: "全部未結案件",
      allOpenDesc: "所有目前仍需處理的案件",
    },
    chips: {
      myCases: "我的案件",
      overdue: "已逾期",
      high: "高優先",
      unassigned: "未指派",
    },
    detail: {
      caseFields: "案件欄位",
      handoffSummary: "案件交接摘要",
      type: "類型",
      subtype: "子類型",
      priority: "優先級",
      owner: "目前負責人",
      collaborators: "協作者",
      slaDue: "結案期限",
      status: "狀態",
      linkedTicket: "關聯技術工單",
      createTechTicket: "建立技術工單",
      noTechTicket: "尚未建立技術工單",
      sourceSystem: "來源系統",
      lastSync: "最後同步",
      engineer: "負責工程師",
      viewExternalTicket: "查看外部工單",
      linkExternalTicket: "搜尋或關聯外部工單",
      linkExternalPlaceholder: "輸入 ENG 編號、標題或狀態",
      noLinkableTicket: "查無可關聯工單。",
      link: "關聯",
      workspace: "客服工作區",
      records: "案件處理紀錄",
      recordsCount: (count: number) => `${count} 則紀錄`,
      conversation: "對話紀錄",
      customerCommunication: "與顧客溝通",
      replyCustomer: "回覆顧客",
      quickReplies: "快捷回覆",
      received: "已收到問題",
      needInfo: "需要補充資料",
      processing: "交易處理中",
      completed: "已處理完成",
      replyPlaceholder: "輸入要回覆給顧客的內容...",
      publicReplyNotice: "公開回覆會傳送給顧客。",
      sendPublicReply: "送出公開回覆",
      ownerOnlyReply: "只有案件 Owner 可以回覆顧客。你仍可在 Comments 留下處理紀錄。",
      history: "案件歷程",
      internalNotice: "內部處理紀錄，不會傳送給顧客",
      noComments: "尚無 Comments。",
      commentPlaceholder: "Add a comment...",
      readOnlyComments: "目前僅可查看 Comments",
      commentsNotice: "Comments 不會傳送給顧客。",
      customerProfile: "顧客基本資料",
      copyCustomer: "複製顧客資訊",
      region: "所在地區",
      tier: "會員等級",
      historyCases: "歷史案件",
      noHistory: "尚無近期歷史案件",
      openCase: "開啟案件",
      tools: "輔助工具",
      toolbox: "工具箱",
      cartPointsLookup: "CartPoints 查詢",
      notCartPoints: "此案件不是 CartPoints 點數問題。",
      knowledgeBase: "知識庫",
    },
    modal: {
      escalate: "升級二線客服",
      assignment: "指派方式",
      assignSecondLine: "指定二線客服",
      queueSecondLine: "放入二線待處理 Queue",
      caseSummary: "系統整理的案件摘要",
      caseType: "案件類型",
      caseId: "案件編號",
      customer: "顧客",
      currentStatus: "目前狀態",
      slaStatus: "SLA 狀態",
      lastCustomerMessage: "最近顧客訊息",
      lastAgentReply: "最近客服回覆",
      completedActions: "已完成動作",
      checkedCustomer: "查看顧客資料",
      checkedHistory: "查看歷史案件",
      usedCartPoints: "使用 CartPoints 排查工具",
      attachedSummary: "附加 CartPoints 查詢摘要",
      repliedCustomer: "已回覆顧客",
      lookupResult: "CartPoints 查詢結果",
      txId: "交易 ID",
      txStatus: "交易狀態",
      duration: "持續時間",
      pointsDelta: "點數異動",
      txSummary: "交易摘要",
      reason: "轉交原因",
      reasonPlaceholder: "系統已帶入案件資訊，可依實際狀況補充",
      note: "補充說明",
      notePlaceholder: "補充一線已確認但系統未自動整理的資訊",
      ask: "希望二線協助事項",
      askPlaceholder: "例如：確認是否需技術支援、判斷交易異常原因",
      cancel: "取消",
      submitEscalate: "送出並升級二線",
    },
  },
  en: {
    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    userMenu: "User menu",
    systemName: "Support ticket system",
    openTabs: "Open ticket tabs",
    close: "Close",
    filter: "Filters",
    queue: {
      myWork: "My work",
      secondLineWork: "Second-line work",
      risk: "Risk queues",
      special: "Special queues",
      all: "All tickets",
      mine: "My open tickets",
      mineDesc: "Open tickets assigned to me",
      waiting: "Waiting for customer",
      waitingDesc: "Waiting for customer details or confirmation",
      escalated: "Escalated follow-up",
      escalatedDesc: "Transferred to second-line or engineering",
      secondMine: "My tickets",
      secondMineDesc: "Tickets where I am the owner",
      secondQueue: "Second-line queue",
      secondQueueDesc: "Unassigned tickets ready for second-line pickup",
      needTech: "Waiting for engineering",
      needTechDesc: "Waiting for an external engineering update",
      dueSoon: "Due soon",
      dueSoonDesc: "Due within 24 hours",
      overdue: "Overdue",
      overdueDesc: "Past closure deadline and needs attention",
      cpAbnormal: "CartPoints exceptions",
      cpStandard: "CartPoints standard",
      cpAbnormalDesc: "CartPoints issues that need second-line review",
      cpStandardDesc: "CartPoints tickets owned by me",
      tech: "Waiting for engineering",
      techDesc: "Waiting for external engineering response",
      allOpen: "All open tickets",
      allOpenDesc: "All tickets that still need handling",
    },
    chips: {
      myCases: "My tickets",
      overdue: "Overdue",
      high: "High priority",
      unassigned: "Unassigned",
    },
    detail: {
      caseFields: "Ticket fields",
      handoffSummary: "Handoff summary",
      type: "Type",
      subtype: "Subtype",
      priority: "Priority",
      owner: "Current owner",
      collaborators: "Collaborators",
      slaDue: "Closure deadline",
      status: "Status",
      linkedTicket: "Linked external ticket",
      createTechTicket: "Create external ticket",
      noTechTicket: "No external ticket linked",
      sourceSystem: "Source system",
      lastSync: "Last sync",
      engineer: "Engineer",
      viewExternalTicket: "View external ticket",
      linkExternalTicket: "Search or link external ticket",
      linkExternalPlaceholder: "Enter ENG ID, title, or status",
      noLinkableTicket: "No linkable tickets found.",
      link: "Link",
      workspace: "Support workspace",
      records: "Ticket activity",
      recordsCount: (count: number) => `${count} records`,
      conversation: "Conversation",
      customerCommunication: "Customer communication",
      replyCustomer: "Reply to customer",
      quickReplies: "Quick replies",
      received: "Issue received",
      needInfo: "Need more information",
      processing: "Transaction processing",
      completed: "Resolved",
      replyPlaceholder: "Type a customer reply...",
      publicReplyNotice: "Public replies are sent to the customer.",
      sendPublicReply: "Send public reply",
      ownerOnlyReply: "Only the ticket owner can reply to the customer. You can still leave a Comment.",
      history: "Ticket history",
      internalNotice: "Internal handling notes. Not sent to the customer.",
      noComments: "No Comments yet.",
      commentPlaceholder: "Add a comment...",
      readOnlyComments: "Comments are read-only for your current access.",
      commentsNotice: "Comments are not sent to the customer.",
      customerProfile: "Customer profile",
      copyCustomer: "Copy customer info",
      region: "Region",
      tier: "Member tier",
      historyCases: "History tickets",
      noHistory: "No recent history tickets",
      openCase: "Open ticket",
      tools: "Support tools",
      toolbox: "Toolbox",
      cartPointsLookup: "CartPoints lookup",
      notCartPoints: "This is not a CartPoints ticket.",
      knowledgeBase: "Knowledge base",
    },
    modal: {
      escalate: "Transfer to second-line",
      assignment: "Assignment",
      assignSecondLine: "Assign a second-line owner",
      queueSecondLine: "Move to second-line queue",
      caseSummary: "System-generated ticket summary",
      caseType: "Ticket type",
      caseId: "Ticket ID",
      customer: "Customer",
      currentStatus: "Current status",
      slaStatus: "SLA status",
      lastCustomerMessage: "Latest customer message",
      lastAgentReply: "Latest agent reply",
      completedActions: "Completed actions",
      checkedCustomer: "Customer profile reviewed",
      checkedHistory: "History tickets reviewed",
      usedCartPoints: "CartPoints lookup used",
      attachedSummary: "CartPoints summary attached",
      repliedCustomer: "Customer already replied",
      lookupResult: "CartPoints lookup result",
      txId: "Transaction ID",
      txStatus: "Transaction status",
      duration: "Duration",
      pointsDelta: "Points delta",
      txSummary: "Transaction summary",
      reason: "Transfer reason",
      reasonPlaceholder: "The system prefilled the summary. Add context if needed.",
      note: "Additional context",
      notePlaceholder: "Add any context the system did not capture.",
      ask: "What should second-line help with?",
      askPlaceholder: "Example: confirm if engineering support is needed.",
      cancel: "Cancel",
      submitEscalate: "Submit transfer",
    },
  },
};

const nowText = () => new Date().toLocaleString("zh-TW", { hour12: false }).replace(/\//g, "-");

function copyToClipboard(text: string, notify: (text: string) => void, locale: Locale = "zh") {
  navigator.clipboard?.writeText(text).then(() => {
    notify(locale === "en" ? "Copied" : "已複製內容");
  }).catch(() => {
    notify(locale === "en" ? "Copy is not supported in this browser" : "目前瀏覽器不支援自動複製");
  });
}

function getSlaMeta(item: SupportCase) {
  if (item.overdue) {
    return { label: "已超時", tone: "red", helper: "超過 SLA" };
  }

  const dueAt = new Date(item.slaDueAt.replace(" ", "T"));
  const hoursLeft = (dueAt.getTime() - Date.now()) / 36e5;

  if (hoursLeft <= 4) {
    return { label: "即將超時", tone: "orange", helper: "4 小時內到期" };
  }

  return { label: "SLA 正常", tone: "green", helper: "仍在服務時限內" };
}

function getSlaWorkMeta(item: SupportCase) {
  const dueAt = new Date(item.slaDueAt.replace(" ", "T"));
  const diffHours = (dueAt.getTime() - Date.now()) / 36e5;
  const absHours = Math.abs(diffHours);

  if (item.overdue || diffHours < 0) {
    const days = Math.max(1, Math.ceil(absHours / 24));
    return { label: `已超時 ${days} 天`, tone: "dark-red", rank: 0 };
  }
  if (diffHours <= 4) return { label: `剩餘 ${Math.max(1, Math.ceil(diffHours))} 小時`, tone: "red", rank: 1 };
  if (diffHours <= 24) return { label: `剩餘 ${Math.ceil(diffHours)} 小時`, tone: "amber", rank: 2 };
  return { label: `剩餘 ${Math.ceil(diffHours / 24)} 天`, tone: "green", rank: 4 };
}

function getProcessStage(item: SupportCase) {
  if (item.status === "待顧客回覆") return { label: "等待顧客", tone: "amber" };
  if (item.status === "待二線客服處理") return { label: "二線客服", tone: "blue" };
  if (item.status === "待技術支援" || item.status === "技術排查中") return { label: "技術排查", tone: "blue" };
  if (item.status === "已解決" || item.status === "已結案") return { label: "已解決", tone: "green" };
  if (item.status === "已關閉" || item.status === "已取消") return { label: "已關閉", tone: "gray" };
  return { label: "一線客服", tone: "gray" };
}

function getNextAction(item: SupportCase) {
  if (item.overdue) return "先處理 SLA 風險";
  if (item.assignee === "未指派") return "等待 Agent 接案";
  if (item.status === "待顧客回覆") return "等待顧客回覆";
  if (item.status === "待技術支援" || item.status === "技術排查中") return "追蹤技術進度";
  if (item.status === "待二線客服處理") return "二線客服接手";
  if (item.isCartPoints && !item.hasTechTicket) return "完成點數排查";
  if (item.status === "已解決") return "確認後結案";
  if (item.status === "已結案") return "已完成";
  return "回覆或補充備註";
}

function getWorkNextStep(item: SupportCase) {
  if (item.status === "待二線客服處理") return "等待二線接手";
  if (item.status === "待技術支援" || item.status === "技術排查中") return "等待技術回覆";
  if (item.status === "待顧客回覆") return "等待補件";
  if (item.status === "已解決") return "準備結案";
  if (item.isCartPoints) return "執行 CartPoints 排查";
  if (item.assignee === "未指派") return "一線客服接案";
  return "回覆或補充備註";
}

function getTypeBadgeLabel(type: CaseType, projectArea: ProjectArea = "tw", locale: Locale = "zh") {
  if (projectArea === "sea" || locale === "en") return type === "CartPoints 點數問題" ? "CartPoints" : seaTypeLabels[type].replace(" issue", "");
  if (type === "CartPoints 點數問題") return "CartPoints";
  return type.replace("問題", "");
}

function getTypeTone(type: CaseType) {
  if (type === "CartPoints 點數問題") return "cartpoints";
  if (type === "退款問題") return "orange";
  if (type === "系統問題") return "blue";
  if (type === "帳號問題") return "green";
  return "gray";
}

function getWorkSortScore(item: SupportCase) {
  const slaRank = getSlaWorkMeta(item).rank;
  if (slaRank === 0) return 0;
  if (slaRank <= 2) return 1;
  if (item.isCartPoints) return 2;
  if (hasHighPriority(item)) return 3;
  return 4;
}

function getWorkStage(item: SupportCase) {
  if (item.status === "新建立" || item.assignee === "未指派") return "新進待接案";
  if (item.status === "待技術支援" || item.status === "技術排查中") return "跨部門協作中";
  if (item.status === "待顧客回覆") return "等待顧客";
  if (item.status === "已解決" || item.status === "已結案") return "收尾階段";
  if (item.status === "已關閉" || item.status === "已取消") return "已停止處理";
  return "客服處理中";
}

function caseNeedsManualCartPoints(item: SupportCase, cartPointsTransactions: CartPointsTransaction[]) {
  return item.isCartPoints && item.relatedTransactionIds.some((id) => {
    const transaction = cartPointsTransactions.find((tx) => tx.id === id);
    return transaction && ["逾時", "失敗", "需人工確認"].includes(transaction.status);
  });
}

function getAssigneeRole(assignee: string) {
  return agents.find((agent) => agent.name === assignee)?.role ?? "未分組";
}

function getDisplayAssigneeName(assignee: string, projectArea: ProjectArea) {
  return projectArea === "sea" ? seaAgentNames[assignee] ?? assignee : assignee;
}

function getDisplayRoleLabel(role: string, projectArea: ProjectArea) {
  return projectArea === "sea" ? seaRoleLabels[role] ?? role : role;
}

function getLocalizedRoleLabel(role: string, locale: Locale, projectArea: ProjectArea) {
  if (locale === "en") return seaRoleLabels[role] ?? role;
  return getDisplayRoleLabel(role, projectArea);
}

function getDisplayAssigneeLabel(assignee: string, projectArea: ProjectArea) {
  if (assignee === "未指派") return projectArea === "sea" ? "Unassigned" : "未指派";
  return `${getDisplayAssigneeName(assignee, projectArea)}（${getDisplayRoleLabel(getAssigneeRole(assignee), projectArea)}）`;
}

function getLocalizedAssigneeLabel(assignee: string, locale: Locale, projectArea: ProjectArea) {
  if (assignee === "未指派") return locale === "en" ? "Unassigned" : projectArea === "sea" ? "Unassigned" : "未指派";
  return `${getDisplayAssigneeName(assignee, projectArea)} (${getLocalizedRoleLabel(getAssigneeRole(assignee), locale, projectArea)})`;
}

function getDisplayCaseType(type: CaseType, projectArea: ProjectArea) {
  return projectArea === "sea" ? seaTypeLabels[type] : type;
}

function getLocalizedCaseType(type: CaseType, locale: Locale, projectArea: ProjectArea) {
  return locale === "en" ? seaTypeLabels[type] : getDisplayCaseType(type, projectArea);
}

function tStatus(status: string, locale: Locale) {
  return locale === "en" ? statusLabelsEn[status as CaseStatus] ?? transactionStatusLabelsEn[status] ?? status : status;
}

function tPriority(priority: Priority, locale: Locale) {
  return locale === "en" ? priorityLabelsEn[priority] : priority;
}

function tTransactionStatus(status: string, locale: Locale) {
  return locale === "en" ? transactionStatusLabelsEn[status] ?? status : status;
}

function tTransactionType(type: string, locale: Locale) {
  return locale === "en" ? transactionTypeLabelsEn[type] ?? type : type;
}

function tEventType(type: string, locale: Locale) {
  return locale === "en" ? eventTypeLabelsEn[type] ?? type : type;
}

function tRegion(projectArea: ProjectArea, locale: Locale) {
  return locale === "en" ? projectArea === "tw" ? "Taiwan" : "Southeast Asia" : getRegion(projectArea);
}

function tSlaLabel(label: string, locale: Locale) {
  if (locale === "zh") return label;
  if (label === "已超時") return "Over SLA";
  if (label === "即將超時") return "Due soon";
  if (label === "SLA 正常") return "On track";
  if (label.startsWith("已超時 ")) return label.replace("已超時 ", "Overdue ").replace(" 天", " days");
  if (label.startsWith("剩餘 ")) return label.replace("剩餘 ", "").replace(" 小時", "h left").replace(" 天", "d left");
  return label;
}

function tDeadlineLabel(label: string, locale: Locale, role: AppRole) {
  if (role === "客服主管") return tSlaLabel(label, locale);
  if (locale === "en") {
    if (label === "已超時") return "Closure overdue";
    if (label === "即將超時") return "Closure due soon";
    if (label === "SLA 正常") return "On track";
    if (label.startsWith("已超時 ")) return label.replace("已超時 ", "Closure overdue ").replace(" 天", " days");
    if (label.startsWith("剩餘 ")) return label.replace("剩餘 ", "").replace(" 小時", "h until closure").replace(" 天", "d until closure");
    return label;
  }
  if (label === "已超時") return "已逾結案期限";
  if (label === "即將超時") return "結案期限將至";
  if (label === "SLA 正常") return "結案期限內";
  if (label.startsWith("已超時 ")) return label.replace("已超時 ", "已逾結案期限 ");
  if (label.startsWith("剩餘 ")) return label.replace("剩餘 ", "距離結案期限 ");
  return label;
}

function getDeadlineColumnLabel(role: AppRole, locale: Locale) {
  if (role === "客服主管") return locale === "en" ? "SLA" : "SLA";
  return locale === "en" ? "Closure deadline" : "距離結案期限";
}

function tEventDescription(event: TimelineEvent, locale: Locale) {
  if (locale === "zh") return event.description;
  const ticket = event.description.match(/(ENG-\d+)/)?.[1];
  const generic: Record<string, string> = {
    案件建立: "Ticket was created.",
    一線客服接案: "Frontline support accepted ownership.",
    補全案件資訊: "Ticket information was updated.",
    使用CartPoints排查工具: "CartPoints lookup was used.",
    "使用 CartPoints 排查工具": "CartPoints lookup was used.",
    附加查詢摘要: "CartPoints lookup summary was added to Comments.",
    升級至二線客服: "Ticket was transferred to second-line support.",
    建立技術工單: ticket ? `External Jira ticket ${ticket} was created.` : "External Jira ticket was created.",
    關聯技術工單: ticket ? `External Jira ticket ${ticket} was linked.` : "External Jira ticket was linked.",
    關聯既有技術工單: ticket ? `External Jira ticket ${ticket} was linked.` : "External Jira ticket was linked.",
    技術工單狀態更新: ticket ? `External Jira ticket ${ticket} was updated.` : "External Jira ticket was updated.",
    回覆顧客: "A public reply was sent to the customer.",
    公開回覆: "A public reply was sent to the customer.",
    新增內部備註: "A Comment was added.",
    二線處理結果: "Second-line analysis was added.",
    二線分析完成: "Second-line analysis was completed.",
    接案: "Ticket ownership was accepted.",
    狀態更新: "Ticket status was updated.",
    指派變更: "Ticket owner was changed.",
    優先級調整: "Ticket priority was updated.",
    結案: "Ticket was closed.",
  };
  return generic[event.type] ?? event.description;
}

function tCommentLabel(label: string, locale: Locale) {
  if (locale === "zh") return label;
  const map: Record<string, string> = {
    查詢結果: "Lookup result",
    交接補充: "Handoff note",
    技術工單: "External ticket",
    二線分析: "Second-line analysis",
    一線備註: "Frontline note",
  };
  return map[label] ?? label;
}

function isOpenCase(item: SupportCase) {
  return !["已解決", "已結案", "已關閉", "已取消"].includes(item.status);
}

function hasHighPriority(item: SupportCase) {
  return item.priority === "高" || item.priority === "緊急";
}

function getVisibleCasesByUser(cases: SupportCase[], user: UserProfile, cartPointsTransactions: CartPointsTransaction[]) {
  if (user.role === "客服主管") return cases;

  if (user.role === "一線客服") {
    return cases.filter((item) =>
      item.assignee === user.name ||
      (["待二線客服處理", "待技術支援", "技術排查中"].includes(item.status) && item.updatedAt >= "2026-06-07")
    );
  }

  if (user.role === "二線客服") {
    return cases.filter((item) =>
      item.assignee === user.name ||
      (item.status === "待二線客服處理" && item.assignee === "未指派") ||
      item.status === "待技術支援" ||
      item.status === "技術排查中" ||
      caseNeedsManualCartPoints(item, cartPointsTransactions)
    );
  }

  return cases;
}

function getRoleQueueGroups(role: AppRole) {
  if (role === "一線客服") return ["我的工作", "高風險案件", "特殊案件"];
  if (role === "二線客服") return ["二線工作", "特殊案件"];
  return ["我的工作", "高風險案件", "特殊案件", "全部案件"];
}

function isTerminalCase(item: SupportCase) {
  return ["已解決", "已結案", "已關閉", "已取消"].includes(item.status);
}

function getPermissionModel(item: SupportCase, user: UserProfile, selectedTx: CartPointsTransaction | null, events: TimelineEvent[]) {
  const isOwner = item.assignee === user.name;
  const isUnassigned = item.assignee === "未指派";
  const canWork = !isTerminalCase(item);
  const isFrontline = user.role === "一線客服";
  const isSecondLine = user.role === "二線客服";
  const isSupervisor = user.role === "客服主管";
  const isCollaborator = getCaseCollaborators(item, events).some((person) => person.name === user.name);

  return {
    isOwner,
    isCollaborator,
    canViewDashboard: isSupervisor,
    canViewAllCases: isSupervisor,
    canViewAdvancedCartPoints: isSecondLine || isSupervisor,
    canComment: canWork && (isOwner || isCollaborator || isSupervisor),
    canReplyCustomer: canWork && (isOwner || isSupervisor),
    canUpdateCaseStatus: canWork && isOwner && !isSupervisor,
    canResolveCase: canWork && isOwner && !isSupervisor,
    canCloseCase: item.status === "已解決" && isOwner && !isSupervisor,
    canEscalateSecondLine: canWork && isOwner && isFrontline && !["待二線客服處理", "待技術支援", "技術排查中"].includes(item.status),
    canTakeOwnership:
      canWork &&
      ((isSecondLine && item.status === "待二線客服處理" && isUnassigned) ||
        (isFrontline && ["新建立", "待受理"].includes(item.status) && isUnassigned)),
    canCreateExternalTicket: canWork && isOwner && isSecondLine,
    canAssignCase: isSupervisor,
    canAdjustPriority: isSupervisor,
  };
}

function getCaseCollaborators(item: SupportCase, events: TimelineEvent[]) {
  const names = new Set<string>();
  events.forEach((event) => {
    if (event.actor !== item.assignee && getAssigneeRole(event.actor) !== "未分組") {
      names.add(event.actor);
    }
  });
  return Array.from(names).map((name) => ({ name, role: getAssigneeRole(name) }));
}

function displayCase(item: SupportCase, projectArea: ProjectArea): SupportCase {
  if (projectArea !== "sea") return item;
  return { ...item, ...seaCaseDisplay[item.id] };
}

function matchesCaseSearch(item: SupportCase, projectArea: ProjectArea, searchTerm: string) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;

  const shown = displayCase(item, projectArea);
  return [
    shown.id,
    shown.userId,
    shown.email,
    shown.customerName,
    shown.title,
    shown.subtype,
  ].some((value) => value.toLowerCase().includes(query));
}

function getIssueSummary(item: SupportCase, projectArea: ProjectArea = "tw") {
  if (projectArea === "sea") {
    if (item.isCartPoints && item.subtype.includes("轉讓")) return "Customer reported that a CartPoints transfer is still processing; transaction status needs review.";
    if (item.isCartPoints) return "Customer reported a CartPoints balance or transaction issue; recent transactions need review.";
    return "Customer reported a service issue; case details and follow-up status need review.";
  }
  if (item.isCartPoints && item.subtype.includes("轉讓")) return "顧客回報 CartPoints 轉讓持續處理中，需確認交易狀態。";
  if (item.isCartPoints) return "顧客回報 CartPoints 帳務或交易異常，需比對交易紀錄。";
  return "顧客回報服務問題，需確認案件資訊與後續處理方式。";
}

function getCustomerMessage(item: SupportCase, projectArea: ProjectArea) {
  if (projectArea === "sea") {
    if (item.id === "CC-2026-0002") return "Hi, my order is marked as shipped, but I still have not received the package. Could you help me check the current status?";
    if (item.id === "CC-2026-0004") return "Hi, I noticed a CartPoints transfer that I did not authorize. Please help me review this account activity.";
    if (item.id === "CC-2026-0005") return "Hi, the campaign points credited to my account do not match the campaign rule. Could you help me verify it?";
    if (item.id === "CC-2026-0006") return "Hi, the member center cannot load my points history. Could you help me check whether this is a system issue?";
    if (item.id === "CC-2026-0008") return "Hi, my CartPoints balance does not match the transaction total. I am worried something did not sync correctly.";
    return "Hi, I need help checking this support request. Could you help me confirm the current status?";
  }
  if (item.id === "CC-2026-0001") return "您好，我在 App 上把點數轉給朋友，畫面一直顯示轉讓中，已經超過 20 分鐘了，想請客服協助確認。";
  if (item.id === "CC-2026-0002") return "您好，我的訂單狀態顯示已出貨，但一直沒有收到包裹，想請客服幫我確認。";
  if (item.id === "CC-2026-0008") return "您好，我的點數餘額和交易紀錄加總不同，擔心有交易沒有正確同步，請協助確認。";
  if (item.isCartPoints) return "您好，我的點數交易一直沒有完成，想請客服協助確認。";
  return "您好，我遇到服務問題，想請客服協助確認處理進度。";
}

function buildExistingHandoffSummary(item: SupportCase, selectedTx: CartPointsTransaction | null, projectArea: ProjectArea, locale: Locale = "zh") {
  if (!["待二線客服處理", "待技術支援", "技術排查中"].includes(item.status)) return null;
  const isSea = projectArea === "sea";
  const isEnglish = locale === "en";
  const frontlineName = getAssigneeRole(item.assignee) === "一線客服"
    ? getDisplayAssigneeName(item.assignee, projectArea)
    : getLocalizedRoleLabel("一線客服", locale, projectArea);
  const frontlineRole = getLocalizedRoleLabel("一線客服", locale, projectArea);
  const caseType = getLocalizedCaseType(item.type, locale, projectArea);
  const txFinding = selectedTx
    ? isEnglish || isSea
      ? `${selectedTx.id} is currently ${selectedTx.status}; confirm whether it is blocked at chain confirmation or status sync.`
      : `${selectedTx.id} 目前為${selectedTx.status}，需確認是否卡在鏈上確認或狀態同步。`
    : getIssueSummary(item, isEnglish ? "sea" : projectArea);
  const labels = isEnglish ? {
    from: "Transferred by",
    time: "Transfer time",
    reason: "Transfer reason",
    checked: "Completed checks",
    finding: "Current findings",
    ask: "Second-line support needed",
  } : {
    from: "轉交人",
    time: "轉交時間",
    reason: "轉交原因",
    checked: "已確認事項",
    finding: "目前發現",
    ask: "需要二線協助",
  };
  return [
    `${labels.from}: ${frontlineName} (${frontlineRole})`,
    `${labels.time}: ${item.updatedAt}`,
    `${labels.reason}: ${isEnglish || isSea
      ? item.isCartPoints ? "CartPoints balance or transaction status needs second-line review" : `${caseType} needs second-line review`
      : item.isCartPoints ? "CartPoints 餘額或交易狀態需二線確認" : `${caseType} 需二線客服確認`}`,
    `${labels.checked}: ${isEnglish || isSea
      ? `Customer profile reviewed, history cases reviewed${item.isCartPoints ? ", CartPoints transactions checked, transaction summary attached" : ""}`
      : `已查看會員資料、已查看歷史案件${item.isCartPoints ? "、已查詢 CartPoints 交易紀錄、已附加交易摘要" : ""}`}`,
    `${labels.finding}: ${txFinding}`,
    `${labels.ask}: ${isEnglish || isSea ? "Confirm whether this is a sync exception and whether external engineering support is needed." : "確認是否為同步異常，並判斷是否需要技術支援。"}`,
  ].filter(Boolean).join("\n");
}

type DiscussionItem = {
  id: string;
  time: string;
  actor: string;
  label: string;
  kind: "customer" | "reply" | "note" | "system";
  content: string;
};

function buildConversationItems(item: SupportCase, projectArea: ProjectArea, locale: Locale, events: TimelineEvent[], defaultReply: string): DiscussionItem[] {
  const shown = displayCase(item, projectArea);
  const publicReplyEvents = events.filter((event) => ["回覆顧客", "公開回覆"].includes(event.type));
  const items: DiscussionItem[] = [
    {
      id: `${item.id}-customer-message`,
      time: item.createdAt,
      actor: shown.customerName,
      label: locale === "en" ? "Customer message" : "顧客訊息",
      kind: "customer",
      content: getCustomerMessage(item, projectArea),
    },
    ...(publicReplyEvents.length === 0 ? [{
      id: `${item.id}-default-reply`,
      time: item.updatedAt,
      actor: getDisplayAssigneeName(item.assignee, projectArea),
      label: locale === "en" ? "Public reply" : "公開回覆",
      kind: "reply" as const,
      content: defaultReply,
    }] : []),
    ...publicReplyEvents.map((event) => ({
      id: event.id,
      time: event.time,
      actor: getDisplayAssigneeName(event.actor, projectArea),
      label: locale === "en" ? "Public reply" : "公開回覆",
      kind: "reply" as const,
      content: tEventDescription(event, locale),
    })),
  ];
  return items.sort((a, b) => a.time.localeCompare(b.time));
}

function buildInternalNoteItems(events: TimelineEvent[], projectArea: ProjectArea, locale: Locale): DiscussionItem[] {
  return events
    .filter((event) => ["新增內部備註", "附加查詢摘要", "升級至二線客服", "二線處理結果", "建立技術工單", "關聯既有技術工單"].includes(event.type))
    .map((event) => ({
      id: event.id,
      time: event.time,
      actor: getDisplayAssigneeName(event.actor, projectArea),
      label: tCommentLabel(getCommentTypeLabel(event), locale),
      kind: "note" as const,
      content: tEventDescription(event, locale),
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

function getCommentTypeLabel(event: TimelineEvent) {
  if (event.type === "附加查詢摘要") return "查詢結果";
  if (event.type === "升級至二線客服") return "交接補充";
  if (["建立技術工單", "關聯既有技術工單"].includes(event.type)) return "技術工單";
  if (event.type === "二線處理結果" || getAssigneeRole(event.actor) === "二線客服") return "二線分析";
  return "一線備註";
}

function getActivityEvents(events: TimelineEvent[]) {
  return events.filter((event) => !["新增內部備註", "回覆顧客", "公開回覆"].includes(event.type));
}

function getCaseOwner(item: SupportCase, events: TimelineEvent[]) {
  if (getAssigneeRole(item.assignee) === "一線客服") return item.assignee;
  const frontlineEvent = events.find((event) => getAssigneeRole(event.actor) === "一線客服");
  return frontlineEvent?.actor ?? "林佳蓉";
}

function getCaseAlerts(item: SupportCase, selectedTx: CartPointsTransaction | null, locale: Locale = "zh") {
  const alerts: string[] = [];
  if (item.overdue) alerts.push(locale === "en" ? "Closure deadline overdue" : "已超過結案期限");
  if (selectedTx && ["需人工確認", "逾時", "失敗"].includes(selectedTx.status)) alerts.push(locale === "en" ? "Abnormal transaction detected" : "發現異常交易");
  if (item.status === "待顧客回覆") alerts.push(locale === "en" ? "Waiting for customer reply" : "等待顧客回覆中");
  return alerts;
}

function getHistoryTags(item: SupportCase, current: SupportCase) {
  const tags = ["相同顧客"];
  if (item.relatedTransactionIds.some((id) => current.relatedTransactionIds.includes(id))) tags.push("相同交易 ID");
  if (item.isCartPoints && current.isCartPoints && item.userId === current.userId) tags.push("相同 CartPoints 帳戶");
  if (item.type === current.type) tags.push("相同問題類型");
  return tags;
}

function sortHistoryCases(items: SupportCase[], current: SupportCase) {
  const rank = (item: SupportCase) => {
    if (item.customerName === current.customerName || item.userId === current.userId) return 0;
    if (item.relatedTransactionIds.some((id) => current.relatedTransactionIds.includes(id))) return 1;
    if (item.isCartPoints && current.isCartPoints) return 2;
    if (item.type === current.type) return 3;
    return 4;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}

function transactionNeedsTech(transaction: CartPointsTransaction | null) {
  if (!transaction) return false;
  return transaction.recommendation.includes("需技術支援") || transaction.status === "逾時" || transaction.status === "失敗";
}

function shouldShowTechTicketCreate(item: SupportCase, selectedTx: CartPointsTransaction | null) {
  return ["待二線客服處理", "待技術支援"].includes(item.status) || transactionNeedsTech(selectedTx);
}

function getMemberTier(userId: string) {
  return transactions.find((tx) => tx.userId === userId)?.memberTier ?? "Silver";
}

function getRegion(projectArea: ProjectArea) {
  return projectArea === "tw" ? "台灣" : "東南亞";
}

function App() {
  const [page, setPage] = useState<Page>("cases");
  const [supportCases, setSupportCases] = useState<SupportCase[]>(initialCases);
  const [techTickets, setTechTickets] = useState<TechTicket[]>(initialTechTickets);
  const [events, setEvents] = useState<TimelineEvent[]>(timelineEvents);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("a1");
  const [projectArea, setProjectArea] = useState<ProjectArea>("tw");
  const [openCaseIds, setOpenCaseIds] = useState<string[]>([]);
  const [locale, setLocale] = useState<Locale>("zh");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];
  const selectedCase = supportCases.find((item) => item.id === selectedCaseId) ?? null;
  const accessibleCases = getVisibleCasesByUser(supportCases, currentUser, transactions);
  const copy = i18n[locale];

  const notify = (text: string) => {
    setToast({ id: Date.now(), text });
    window.setTimeout(() => setToast(null), 2600);
  };

  const addEvent = (caseId: string, type: string, description: string, actor = "目前使用者") => {
    setEvents((current) => [
      { id: `ev-${Date.now()}`, caseId, time: nowText(), actor, type, description },
      ...current,
    ]);
  };

  const updateCase = (caseId: string, patch: Partial<SupportCase>) => {
    setSupportCases((current) =>
      current.map((item) => (item.id === caseId ? { ...item, ...patch, updatedAt: nowText() } : item))
    );
  };
  const openCase = (caseId: string) => {
    setPage("cases");
    setSelectedCaseId(caseId);
    setOpenCaseIds((current) => [caseId, ...current.filter((id) => id !== caseId)].slice(0, 6));
  };
  const closeCaseTab = (caseId: string) => {
    setOpenCaseIds((current) => {
      const next = current.filter((id) => id !== caseId);
      if (selectedCaseId === caseId) setSelectedCaseId(next[0] ?? null);
      return next;
    });
  };
  const showCaseList = () => setSelectedCaseId(null);

  return (
    <div className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
      <aside className="sidebar">
        <button
          className="sidebar-collapse-button"
          onClick={() => setSidebarCollapsed((value) => !value)}
          aria-label={sidebarCollapsed ? uiText[locale].expandSidebar : uiText[locale].collapseSidebar}
          title={sidebarCollapsed ? uiText[locale].expandSidebar : uiText[locale].collapseSidebar}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>
        <label className="sidebar-user brand-user-menu">
          <span className="user-icon" aria-hidden="true">{currentUser.name.slice(0, 1)}</span>
          <span>
            <small>{copy.currentUser}</small>
            <select
              aria-label={uiText[locale].userMenu}
              value={currentUserId}
              onChange={(event) => {
                const nextUser = users.find((user) => user.id === event.target.value) ?? users[0];
                setCurrentUserId(event.target.value);
                setSelectedCaseId(null);
                setPage(nextUser.role === "客服主管" ? "dashboard" : "cases");
              }}
            >
              {users.map((user) => <option key={user.id} value={user.id}>{user.name} ({getLocalizedRoleLabel(user.role, locale, projectArea)})</option>)}
            </select>
          </span>
        </label>
        <nav>
          <div className="nav-section">
            <span className="nav-section-title">{copy.ticketListSection}</span>
            <ProjectButton active={page === "cases" && projectArea === "tw"} area="tw" label={copy.taiwanProject} count={accessibleCases.filter((item) => isOpenCase(item)).length} onClick={() => { setProjectArea("tw"); setPage("cases"); setSelectedCaseId(null); }} />
            <ProjectButton active={page === "cases" && projectArea === "sea"} area="sea" label={copy.seaProject} count={accessibleCases.filter((item) => (item.isCartPoints || item.type === "系統問題") && isOpenCase(item)).length} onClick={() => { setProjectArea("sea"); setPage("cases"); setSelectedCaseId(null); }} />
          </div>
          {currentUser.role === "客服主管" && (
            <div className="nav-section">
              <span className="nav-section-title">{copy.operations}</span>
              <NavButton active={page === "dashboard"} label={copy.dashboard} icon="▦" onClick={() => { setPage("dashboard"); setSelectedCaseId(null); }} />
            </div>
          )}
          <div className="nav-section">
            <span className="nav-section-title">{copy.supportSettings}</span>
            <NavButton active={page === "kb"} label={copy.knowledgeBase} icon="◫" onClick={() => { setPage("kb"); setSelectedCaseId(null); }} />
            <NavButton active={page === "settings"} label={copy.settings} icon="⚙" onClick={() => { setPage("settings"); setSelectedCaseId(null); }} />
          </div>
          <div className="nav-section">
            <span className="nav-section-title">{copy.language}</span>
            <label className="language-switcher">
              <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} aria-label={copy.language}>
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </nav>
        <div className="sidebar-logo" aria-label="CartCare">
          <span>C</span>
          <div>
            <strong>CartCare</strong>
            <small>{uiText[locale].systemName}</small>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">{copy.platform}</p>
            <h1>{page === "cases" ? (projectArea === "tw" ? copy.taiwanCenter : copy.seaCenter) : pageTitle(page, locale)}</h1>
          </div>
        </header>
        {page === "cases" && openCaseIds.length > 0 && (
          <TicketTabs
            cases={supportCases.filter((item) => openCaseIds.includes(item.id))}
            projectArea={projectArea}
            locale={locale}
            activeId={selectedCaseId}
            onSelect={setSelectedCaseId}
            onClose={closeCaseTab}
            onShowList={showCaseList}
          />
        )}

        {selectedCase ? (
          <CaseDetail
            supportCase={selectedCase}
            projectArea={projectArea}
            locale={locale}
            currentUser={currentUser}
            cases={supportCases}
            transactions={transactions}
            techTickets={techTickets}
            events={events.filter((event) => event.caseId === selectedCase.id)}
            updateCase={updateCase}
            setTechTickets={setTechTickets}
            addEvent={addEvent}
            notify={notify}
            onOpenCase={openCase}
          />
        ) : page === "cases" ? (
          <CaseList cases={supportCases} transactions={transactions} currentUser={currentUser} projectArea={projectArea} locale={locale} onSelect={openCase} />
        ) : page === "dashboard" ? (
          <Dashboard
            cases={supportCases}
            dashboardFilter={dashboardFilter}
            setDashboardFilter={setDashboardFilter}
            onSelect={openCase}
            locale={locale}
          />
        ) : page === "kb" ? (
          <KnowledgeBase locale={locale} />
        ) : (
          <Placeholder title={pageTitle(page, locale)} locale={locale} />
        )}
      </main>
      {toast && <div className="toast">{toast.text}</div>}
    </div>
  );
}

function NavButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: string; onClick: () => void }) {
  return <button className={active ? "nav-button active" : "nav-button"} onClick={onClick} title={label}><b className="nav-icon">{icon}</b><span>{label}</span></button>;
}

function ProjectButton({ active, area, label, count, onClick }: { active: boolean; area: ProjectArea; label: string; count: number; onClick: () => void }) {
  return (
    <button className={active ? "project-button active" : "project-button"} onClick={onClick} title={label}>
      <b className="project-icon">{area === "sea" ? "SEA" : "TW"}</b>
      <span className="project-label">{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function TicketTabs({ cases, projectArea, locale, activeId, onSelect, onClose, onShowList }: {
  cases: SupportCase[];
  projectArea: ProjectArea;
  locale: Locale;
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onShowList: () => void;
}) {
  return (
    <div className="ticket-tabs-shell" aria-label={uiText[locale].openTabs}>
      <button className={activeId === null ? "list-tab active" : "list-tab"} onClick={onShowList}>
        {i18n[locale].ticketListSection}
      </button>
      <div className="ticket-tabs">
        {cases.map((item) => {
          const shown = displayCase(item, projectArea);
          return (
            <button key={item.id} className={activeId === item.id ? "ticket-tab active" : "ticket-tab"} onClick={() => onSelect(item.id)}>
              <span>{shown.id}</span>
              <strong>{shown.title}</strong>
              <span onClick={(event) => { event.stopPropagation(); onClose(item.id); }} aria-label={`${uiText[locale].close} ${item.id}`}>×</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pageTitle(page: Page, locale: Locale) {
  const copy = i18n[locale];
  return { cases: copy.ticketListSection, dashboard: locale === "zh" ? "客服營運總覽" : "Support Operations Dashboard", kb: copy.knowledgeBase, settings: copy.settings }[page];
}

function CaseList({ cases, transactions, currentUser, projectArea, locale, onSelect }: { cases: SupportCase[]; transactions: CartPointsTransaction[]; currentUser: UserProfile; projectArea: ProjectArea; locale: Locale; onSelect: (id: string) => void }) {
  const [filters, setFilters] = useState({ status: "全部", type: "全部", priority: "全部", assignee: "全部", cartpoints: "全部", overdue: "全部" });
  const [activeQueue, setActiveQueue] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const copy = i18n[locale];
  const text = uiText[locale];
  const projectCases = projectArea === "sea" ? cases.filter((item) => item.isCartPoints || item.type === "系統問題") : cases;
  const visibleCases = getVisibleCasesByUser(projectCases, currentUser, transactions);
  const baseWorkQueues = [
    { group: "我的工作", displayGroup: text.queue.myWork, id: "mine", icon: "●", label: text.queue.mine, description: text.queue.mineDesc, matcher: (item: SupportCase) => item.assignee === currentUser.name && isOpenCase(item) },
    { group: "我的工作", displayGroup: text.queue.myWork, id: "waiting", icon: "◷", label: text.queue.waiting, description: text.queue.waitingDesc, matcher: (item: SupportCase) => item.assignee === currentUser.name && item.status === "待顧客回覆" },
    { group: "我的工作", displayGroup: text.queue.myWork, id: "escalated", icon: "↗", label: text.queue.escalated, description: text.queue.escalatedDesc, matcher: (item: SupportCase) => ["待二線客服處理", "待技術支援", "技術排查中"].includes(item.status) },
    { group: "二線工作", displayGroup: text.queue.secondLineWork, id: "secondMine", icon: "●", label: text.queue.secondMine, description: text.queue.secondMineDesc, matcher: (item: SupportCase) => item.assignee === currentUser.name && isOpenCase(item) },
    { group: "二線工作", displayGroup: text.queue.secondLineWork, id: "secondQueue", icon: "◆", label: text.queue.secondQueue, description: text.queue.secondQueueDesc, matcher: (item: SupportCase) => item.status === "待二線客服處理" && item.assignee === "未指派" },
    { group: "二線工作", displayGroup: text.queue.secondLineWork, id: "needTech", icon: "◇", label: text.queue.needTech, description: text.queue.needTechDesc, matcher: (item: SupportCase) => item.status === "待技術支援" || item.status === "技術排查中" },
    { group: "高風險案件", displayGroup: text.queue.risk, id: "dueSoon", icon: "!", label: text.queue.dueSoon, description: text.queue.dueSoonDesc, matcher: (item: SupportCase) => getSlaWorkMeta(item).rank === 1 || getSlaWorkMeta(item).rank === 2 },
    { group: "高風險案件", displayGroup: text.queue.risk, id: "overdue", icon: "×", label: text.queue.overdue, description: text.queue.overdueDesc, matcher: (item: SupportCase) => getSlaWorkMeta(item).rank === 0 },
    { group: "特殊案件", displayGroup: text.queue.special, id: "cartpoints", icon: "C", label: currentUser.role === "二線客服" ? text.queue.cpAbnormal : text.queue.cpStandard, description: currentUser.role === "二線客服" ? text.queue.cpAbnormalDesc : text.queue.cpStandardDesc, matcher: (item: SupportCase) => currentUser.role === "二線客服" ? caseNeedsManualCartPoints(item, transactions) : item.isCartPoints && item.assignee === currentUser.name },
    { group: "特殊案件", displayGroup: text.queue.special, id: "tech", icon: "T", label: text.queue.tech, description: text.queue.techDesc, matcher: (item: SupportCase) => item.status === "待技術支援" || item.status === "技術排查中" },
    { group: "全部案件", displayGroup: text.queue.all, id: "all", icon: "A", label: text.queue.allOpen, description: text.queue.allOpenDesc, matcher: (item: SupportCase) => isOpenCase(item) },
  ];
  const visibleGroups = getRoleQueueGroups(currentUser.role);
  const workQueues = baseWorkQueues.filter((queue) => visibleGroups.includes(queue.group));
  const queueMatchers = Object.fromEntries(workQueues.map((queue) => [queue.id, queue.matcher])) as Record<string, (item: SupportCase) => boolean>;
  const queues = workQueues.map((queue) => ({
    ...queue,
    count: visibleCases.filter(queueMatchers[queue.id]).length,
  }));
  const quickFilters = [
    { id: "mine", label: text.chips.myCases, apply: () => { setActiveQueue(currentUser.role === "二線客服" ? "secondMine" : currentUser.role === "客服主管" ? "all" : "mine"); setFilters({ status: "全部", type: "全部", priority: "全部", assignee: "全部", cartpoints: "全部", overdue: "全部" }); } },
    { id: "overdue-chip", label: text.chips.overdue, apply: () => { setActiveQueue(null); setFilters({ status: "全部", type: "全部", priority: "全部", assignee: "全部", cartpoints: "全部", overdue: "true" }); } },
    { id: "high-chip", label: text.chips.high, apply: () => { setActiveQueue(null); setFilters({ status: "全部", type: "全部", priority: "高", assignee: "全部", cartpoints: "全部", overdue: "全部" }); } },
    { id: "unassigned-chip", label: text.chips.unassigned, apply: () => { setActiveQueue(null); setFilters({ status: "全部", type: "全部", priority: "全部", assignee: "未指派", cartpoints: "全部", overdue: "全部" }); } },
  ];
  const filtered = visibleCases.filter((item) =>
    (filters.status === "全部" || item.status === filters.status) &&
    (filters.type === "全部" || item.type === filters.type) &&
    (filters.priority === "全部" || item.priority === filters.priority) &&
    (filters.assignee === "全部" || item.assignee === filters.assignee) &&
    (filters.cartpoints === "全部" || String(item.isCartPoints) === filters.cartpoints) &&
    (filters.overdue === "全部" || String(item.overdue) === filters.overdue) &&
    (activeQueue === null || queueMatchers[activeQueue]?.(item)) &&
    matchesCaseSearch(item, projectArea, searchTerm)
  );
  const sorted = [...filtered].sort((a, b) => {
    const score = getWorkSortScore(a) - getWorkSortScore(b);
    if (score !== 0) return score;
    if (hasHighPriority(a) !== hasHighPriority(b)) return hasHighPriority(a) ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
  const caseKindLabel = (item: SupportCase) => projectArea === "sea"
    ? item.isCartPoints ? "CartPoints case" : "General case"
    : item.isCartPoints ? "CartPoints" : "一般案件";
  const techLinkLabel = (item: SupportCase) => projectArea === "sea"
    ? item.hasTechTicket ? "Tech linked" : "No tech ticket"
    : item.hasTechTicket ? "已關聯技術" : "未關聯技術";

  return (
    <section className="content-stack">
      <div className="case-center-layout">
        <aside className="project-queue-panel" aria-label="案件佇列">
          <div className="service-project-card">
            <div>
              <strong>{projectArea === "tw" ? copy.taiwanProject : copy.seaProject}</strong>
              <small>{currentUser.name} · {getLocalizedRoleLabel(currentUser.role, locale, projectArea)}</small>
            </div>
          </div>
          {visibleGroups.map((group) => (
            <div className="queue-nav-group" key={group}>
              <span className="queue-nav-title">{queues.find((queue) => queue.group === group)?.displayGroup ?? group}</span>
              {queues.filter((queue) => queue.group === group).map((queue) => (
                <button
                  key={queue.id}
                  className={activeQueue === queue.id ? "queue-nav-item work active" : "queue-nav-item work"}
                  onClick={() => {
                    setFilters({ status: "全部", type: "全部", priority: "全部", assignee: "全部", cartpoints: "全部", overdue: "全部" });
                    setActiveQueue(activeQueue === queue.id ? null : queue.id);
                  }}
                  title={queue.label}
                >
                  <b className="queue-icon">{queue.icon}</b>
                  <span>
                    <strong>{queue.label}</strong>
                    <small>{queue.description}</small>
                  </span>
                  <em>{queue.count}</em>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <div className="case-list-main">
          <div className="case-toolbar">
            <div className="case-toolbar-top">
              <div className="case-search">
                <div>
                  <span aria-hidden="true">⌕</span>
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={copy.searchPlaceholder}
                    aria-label="搜尋案件"
                  />
                </div>
                {searchTerm && <button className="ghost-button" onClick={() => setSearchTerm("")}>{copy.clear}</button>}
              </div>
              <button className="filter-toggle-button" type="button">{text.filter}</button>
              <span className="toolbar-count">{copy.visibleCount(filtered.length, visibleCases.length)}</span>
            </div>

            <div className="quick-filter-row" aria-label="快速篩選">
              {quickFilters.map((chip) => (
                <button key={chip.id} onClick={chip.apply}>{chip.label}</button>
              ))}
            </div>

            <div className="filter-bar compact-filter-bar">
              <Select label={copy.status} value={filters.status} options={["全部", ...statuses]} optionLabel={(value) => value === "全部" ? copy.all : tStatus(value, locale)} onChange={(value) => { setActiveQueue(null); setFilters({ ...filters, status: value }); }} />
              <Select label={copy.type} value={filters.type} options={["全部", ...caseTypes]} optionLabel={(value) => value === "全部" ? copy.all : getLocalizedCaseType(value as CaseType, locale, projectArea)} onChange={(value) => { setActiveQueue(null); setFilters({ ...filters, type: value }); }} />
              <Select label={copy.priority} value={filters.priority} options={["全部", ...priorities]} optionLabel={(value) => value === "全部" ? copy.all : tPriority(value as Priority, locale)} onChange={(value) => { setActiveQueue(null); setFilters({ ...filters, priority: value }); }} />
              <Select label={copy.overdue} value={filters.overdue} options={["全部", "true", "false"]} optionLabel={(value) => value === "true" ? copy.yes : value === "false" ? copy.no : copy.all} onChange={(value) => { setActiveQueue(null); setFilters({ ...filters, overdue: value }); }} />
            </div>
          </div>

          <div className="table-card">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>{locale === "en" ? "Ticket ID" : "案件編號"}</th>
                  <th>{copy.type}</th>
                  <th>{locale === "en" ? "Ticket details" : "案件資訊"}</th>
                  <th>{copy.priority}</th>
                  <th>{copy.assignee}</th>
                  <th>{copy.customer}</th>
                  <th>{getDeadlineColumnLabel(currentUser.role, locale)}</th>
                  <th>{copy.status}</th>
                  <th>{copy.lastUpdated}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => {
                  const shown = displayCase(item, projectArea);
                  const workSla = getSlaWorkMeta(item);
                  const stage = getProcessStage(item);
                  return (
                    <tr key={item.id} onClick={() => onSelect(item.id)}>
                      <td>
                        <div className="ticket-id-cell">
                      <strong>{shown.id}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="case-type-cell">
                        <span className={`type-badge ${getTypeTone(item.type)}`}>{getTypeBadgeLabel(item.type, projectArea, locale)}</span>
                      <small>{shown.subtype}</small>
                    </div>
                  </td>
                  <td>
                    <div className="case-info-cell simple">
                      <span>{shown.title}</span>
                    </div>
                  </td>
                  <td><PriorityBadge value={item.priority} locale={locale} /></td>
                  <td>
                    <div className="stacked-cell">
                          <span>{getDisplayAssigneeName(item.assignee, projectArea)}</span>
                          <small>{getLocalizedRoleLabel(getAssigneeRole(item.assignee), locale, projectArea)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="stacked-cell">
                          <span>{shown.customerName}</span>
                          <small>{shown.email}</small>
                        </div>
                      </td>
                      <td>
                        <StatusBadge value={tDeadlineLabel(workSla.label, locale, currentUser.role)} tone={workSla.tone} />
                      </td>
                      <td>
                        <StatusBadge value={tStatus(item.status, locale)} tone={stage.tone} />
                      </td>
                      <td>{item.updatedAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseDetail(props: {
  supportCase: SupportCase;
  projectArea: ProjectArea;
  locale: Locale;
  currentUser: UserProfile;
  cases: SupportCase[];
  transactions: CartPointsTransaction[];
  techTickets: TechTicket[];
  events: TimelineEvent[];
  updateCase: (id: string, patch: Partial<SupportCase>) => void;
  setTechTickets: React.Dispatch<React.SetStateAction<TechTicket[]>>;
  addEvent: (caseId: string, type: string, description: string, actor?: string) => void;
  notify: (text: string) => void;
  onOpenCase: (id: string) => void;
}) {
  const { supportCase, projectArea, locale, currentUser, cases, transactions, techTickets, events, updateCase, addEvent, notify, setTechTickets, onOpenCase } = props;
  const text = uiText[locale];
  const shownCase = displayCase(supportCase, projectArea);
  const [modalOpen, setModalOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffSummary, setHandoffSummary] = useState<string | null>(null);
  const [handoffReason, setHandoffReason] = useState(supportCase.isCartPoints ? "CartPoints 餘額或交易狀態需二線確認" : "一線無法依 SOP 完成處理");
  const [handoffNote, setHandoffNote] = useState("");
  const [handoffAsk, setHandoffAsk] = useState("");
  const [handoffMode, setHandoffMode] = useState<"指定二線客服" | "放入二線待處理 Queue">("指定二線客服");
  const [handoffAssignee, setHandoffAssignee] = useState("張柏翰");
  const [selectedTx, setSelectedTx] = useState<CartPointsTransaction | null>(transactions.find((tx) => supportCase.relatedTransactionIds.includes(tx.id)) ?? null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [recordTab, setRecordTab] = useState<"comments" | "history">("comments");
  const [techTicketQuery, setTechTicketQuery] = useState("");
  const [openProperty, setOpenProperty] = useState<string | null>(null);
  const [closeMenuOpen, setCloseMenuOpen] = useState(false);
  const lastSubmittedReplyRef = useRef<string | null>(null);
  const relatedTickets = techTickets.filter((ticket) => supportCase.relatedTechTicketIds.includes(ticket.id));
  const historyCases = sortHistoryCases(cases.filter((item) => supportCase.historyCaseIds.includes(item.id)), supportCase).slice(0, 3);
  const sla = getSlaMeta(supportCase);
  const alerts = getCaseAlerts(supportCase, selectedTx, locale);
  const permissions = getPermissionModel(supportCase, currentUser, selectedTx, events);
  const canManageExternalTickets = (currentUser.role === "二線客服" && permissions.isOwner) || permissions.canAssignCase;
  const linkableTickets = techTickets
    .filter((ticket) => !supportCase.relatedTechTicketIds.includes(ticket.id))
    .filter((ticket) => {
      const query = techTicketQuery.trim().toLowerCase();
      if (!query) return true;
      return [ticket.id, ticket.title, ticket.status, ticket.assignee].some((value) => value.toLowerCase().includes(query));
    })
    .slice(0, 4);
  const collaborators = getCaseCollaborators(supportCase, events);
  const publicReplies = events.filter((event) => ["回覆顧客", "公開回覆"].includes(event.type));
  const lastCustomerMessage = getCustomerMessage(supportCase, projectArea);
  const lastAgentReply = publicReplies[0]
    ? tEventDescription(publicReplies[0], locale)
    : locale === "en"
      ? supportCase.isCartPoints
        ? "We have checked the customer profile and recent CartPoints transactions, and will confirm whether second-line or engineering support is needed."
        : "We have checked the customer profile and ticket details, and will reply with the latest update."
      : supportCase.isCartPoints ? "已協助查詢會員資料與近期 CartPoints 交易，會先確認是否需升級二線或技術支援。" : "已協助查詢會員資料與案件資訊，會盡快回覆最新進度。";
  const handoffBlock = handoffSummary ?? buildExistingHandoffSummary(supportCase, selectedTx, projectArea, locale);
  const conversationItems = buildConversationItems(supportCase, projectArea, locale, events, lastAgentReply);
  const internalNoteItems = buildInternalNoteItems(events, projectArea, locale);
  const activityEvents = getActivityEvents(events);
  const commentEntries = [
    ...internalNoteItems.map((item) => ({ kind: "comment" as const, time: item.time, item })),
    ...relatedTickets.map((ticket) => ({ kind: "externalTicket" as const, time: getExternalTicketSyncedAt(ticket), ticket })),
  ].sort((a, b) => a.time.localeCompare(b.time));
  const subtypeOptions = subtypeOptionsByType[supportCase.type] ?? [supportCase.subtype];
  const editableAgentOptions = ["未指派", ...agents.map((agent) => agent.name)];
  const collaboratorOptions = agents
    .map((agent) => agent.name)
    .filter((name) => name !== supportCase.assignee && !collaborators.some((person) => person.name === name));

  const runAction = (type: string, description: string, patch?: Partial<SupportCase>) => {
    if (patch) updateCase(supportCase.id, patch);
    addEvent(supportCase.id, type, description, currentUser.name);
    notify(description);
  };
  const closeCaseWithReason = (reason: (typeof closeReasons)[number]) => {
    const description = locale === "en"
      ? `Ticket was closed. Reason: ${reason.en}.`
      : `案件已關閉。原因：${reason.zh}。`;
    runAction("關閉案件", description, { status: "已關閉" });
    setCloseMenuOpen(false);
  };
  const submitPublicReply = () => {
    const fallback = locale === "en" ? "Customer was replied to and ticket record was updated." : "已回覆顧客並更新案件紀錄。";
    const finalReply = replyText.trim() || fallback;
    const signature = `${supportCase.id}:${finalReply}`;
    if (lastSubmittedReplyRef.current === signature) return;
    lastSubmittedReplyRef.current = signature;
    runAction("公開回覆", finalReply, { status: "待顧客回覆" });
    setReplyText("");
    window.setTimeout(() => {
      if (lastSubmittedReplyRef.current === signature) lastSubmittedReplyRef.current = null;
    }, 700);
  };
  const linkExternalTicket = (ticket: TechTicket) => {
    updateCase(supportCase.id, {
      status: supportCase.status === "待技術支援" || supportCase.status === "技術排查中" ? supportCase.status : "待技術支援",
      hasTechTicket: true,
      relatedTechTicketIds: [...supportCase.relatedTechTicketIds, ticket.id],
    });
    addEvent(supportCase.id, "關聯技術工單", `已關聯外部工單 ${ticket.id}。`, currentUser.name);
    notify(`已關聯外部工單 ${ticket.id}`);
    setTechTicketQuery("");
  };
  const submitHandoff = () => {
    const isSea = projectArea === "sea";
    const isEnglish = locale === "en";
    const currentUserLabel = getDisplayAssigneeName(currentUser.name, projectArea);
    const currentRoleLabel = getLocalizedRoleLabel(currentUser.role, locale, projectArea);
    const txFinding = selectedTx
      ? isSea || isEnglish
        ? `${selectedTx.id} is currently ${selectedTx.status}; confirm whether it is blocked at chain confirmation or status sync.`
        : `${selectedTx.id} 目前為${selectedTx.status}，需確認是否卡在鏈上確認或狀態同步。`
      : getIssueSummary(supportCase, isEnglish ? "sea" : projectArea);
    const summaryLabels = isEnglish ? {
      from: "Transferred by",
      time: "Transfer time",
      reason: "Transfer reason",
      checked: "Completed checks",
      finding: "Current findings",
      ask: "Second-line support needed",
      note: "Additional context",
    } : {
      from: "轉交人",
      time: "轉交時間",
      reason: "轉交原因",
      checked: "已確認事項",
      finding: "目前發現",
      ask: "需要二線協助",
      note: "交接補充",
    };
    const summary = [
      `${summaryLabels.from}: ${currentUserLabel} (${currentRoleLabel})`,
      `${summaryLabels.time}: ${nowText()}`,
      `${summaryLabels.reason}: ${handoffReason.trim() || (isSea || isEnglish ? "Needs second-line review" : "需二線客服協助判斷")}`,
      `${summaryLabels.checked}: ${isSea || isEnglish
        ? `Customer profile reviewed${historyCases.length > 0 ? ", history cases reviewed" : ""}${supportCase.isCartPoints ? ", CartPoints transactions checked" : ""}${events.some((event) => event.type === "附加查詢摘要") ? ", transaction summary attached" : ""}`
        : `已查看會員資料${historyCases.length > 0 ? "、已查看歷史案件" : ""}${supportCase.isCartPoints ? "、已查詢 CartPoints 交易紀錄" : ""}${events.some((event) => event.type === "附加查詢摘要") ? "、已附加交易摘要" : ""}`}`,
      `${summaryLabels.finding}: ${txFinding}`,
      `${summaryLabels.ask}: ${handoffAsk.trim() || (isSea || isEnglish ? "Review the current findings and provide analysis." : "確認目前發現並提供分析結果。")}`,
      handoffNote.trim() ? `${summaryLabels.note}: ${handoffNote.trim()}` : "",
    ].filter(Boolean).join("\n");

    setHandoffSummary(summary);
    const nextOwner = handoffMode === "指定二線客服" ? handoffAssignee : "未指派";
    updateCase(supportCase.id, { status: "待二線客服處理", assignee: nextOwner });
    addEvent(
      supportCase.id,
      "升級至二線客服",
      handoffMode === "指定二線客服"
        ? (locale === "en" ? `Handoff summary submitted. Owner assigned to ${getDisplayAssigneeName(nextOwner, projectArea)}.` : `一線客服已送出案件交接摘要，Owner 指定為 ${getDisplayAssigneeName(nextOwner, projectArea)}。`)
        : (locale === "en" ? "Handoff summary submitted. Ticket moved to the second-line queue." : "一線客服已送出案件交接摘要，案件放入二線待處理 Queue。"),
      currentUser.name
    );
    notify(locale === "en" ? "Transferred to second-line with handoff summary" : "已升級二線並建立案件交接摘要");
    setHandoffOpen(false);
  };
  const updateCaseType = (nextType: CaseType) => {
    const nextSubtype = subtypeOptionsByType[nextType][0] ?? supportCase.subtype;
    updateCase(supportCase.id, { type: nextType, subtype: nextSubtype, isCartPoints: nextType === "CartPoints 點數問題" });
    addEvent(supportCase.id, "補全案件資訊", locale === "en" ? `Ticket type changed to ${getLocalizedCaseType(nextType, locale, projectArea)}.` : `案件類型更新為 ${nextType}。`, currentUser.name);
    notify(locale === "en" ? "Ticket type updated" : "已更新案件類型");
    setOpenProperty(null);
  };
  const updateCaseSubtype = (nextSubtype: string) => {
    updateCase(supportCase.id, { subtype: nextSubtype });
    addEvent(supportCase.id, "補全案件資訊", locale === "en" ? `Subtype changed to ${nextSubtype}.` : `案件子類型更新為 ${nextSubtype}。`, currentUser.name);
    notify(locale === "en" ? "Subtype updated" : "已更新子類型");
    setOpenProperty(null);
  };
  const updateCasePriority = (nextPriority: Priority) => {
    updateCase(supportCase.id, { priority: nextPriority });
    addEvent(supportCase.id, "優先級調整", locale === "en" ? `Priority changed to ${tPriority(nextPriority, locale)}.` : `優先級更新為 ${nextPriority}。`, currentUser.name);
    notify(locale === "en" ? "Priority updated" : "已更新優先級");
    setOpenProperty(null);
  };
  const updateCaseOwner = (nextOwner: string) => {
    updateCase(supportCase.id, { assignee: nextOwner });
    addEvent(supportCase.id, "指派變更", locale === "en" ? `Owner changed to ${getLocalizedAssigneeLabel(nextOwner, locale, projectArea)}.` : `目前負責人更新為 ${getLocalizedAssigneeLabel(nextOwner, locale, projectArea)}。`, currentUser.name);
    notify(locale === "en" ? "Owner updated" : "已更新目前負責人");
    setOpenProperty(null);
  };
  const addCollaborator = (name: string) => {
    if (!name) return;
    addEvent(supportCase.id, "協作者更新", locale === "en" ? `${getDisplayAssigneeName(name, projectArea)} was added as a collaborator.` : `已將 ${getDisplayAssigneeName(name, projectArea)} 加入協作者。`, name);
    notify(locale === "en" ? "Collaborator added" : "已新增協作者");
    setOpenProperty(null);
  };

  return (
    <div className="case-workspace">
      <section className={`ticket-titlebar case-summary ${sla.tone}`}>
        <div className="ticket-title-main">
          <div className="ticket-heading-row">
            <span className="ticket-key">{supportCase.id}</span>
            <h2>{shownCase.title}</h2>
          </div>
          <div className="ticket-title-meta">
            <StatusBadge value={tStatus(supportCase.status, locale)} />
            <StatusBadge value={tDeadlineLabel(sla.label, locale, currentUser.role)} tone={sla.tone} />
            <PriorityBadge value={supportCase.priority} locale={locale} />
          </div>
        </div>
        <div className="case-action-chips" aria-label={locale === "en" ? "Ticket quick actions" : "案件快速操作"}>
          {permissions.canTakeOwnership && (
            <button onClick={() => runAction("接案", locale === "en" ? `${currentUser.name} accepted ticket ownership.` : `${currentUser.name} 已成為案件 Owner。`, { status: "處理中", assignee: currentUser.name })}>{locale === "en" ? "Take ownership" : "接手案件"}</button>
          )}
          {permissions.canResolveCase && (currentUser.role === "二線客服" || ["處理中", "待顧客回覆"].includes(supportCase.status)) && (
            <>
              <button onClick={() => runAction("狀態更新", locale === "en" ? "Issue was resolved and marked as resolved." : "問題已處理完成，標記為已解決。", { status: "已解決" })}>{locale === "en" ? "Mark resolved" : "標記已解決"}</button>
              {(supportCase.status === "處理中" || (currentUser.role === "一線客服" && supportCase.status === "待顧客回覆")) && (
                <div className="case-action-menu">
                  <button
                    aria-expanded={closeMenuOpen}
                    aria-haspopup="menu"
                    onClick={() => setCloseMenuOpen((open) => !open)}
                  >
                    {locale === "en" ? "Close ticket" : "關閉案件"}
                  </button>
                  {closeMenuOpen && (
                    <div className="case-close-reason-menu" role="menu">
                      <span>{locale === "en" ? "Select close reason" : "選擇關閉原因"}</span>
                      {closeReasons.map((reason) => (
                        <button key={reason.zh} role="menuitem" onClick={() => closeCaseWithReason(reason)}>
                          {locale === "en" ? reason.en : reason.zh}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {permissions.canAssignCase && (
            <>
              <button onClick={() => runAction("指派變更", locale === "en" ? "Manager assigned ticket ownership to Lin Chia-jung." : "主管已將案件 Owner 指派給林佳蓉。", { assignee: "林佳蓉" })}>{locale === "en" ? "Assign Lin" : "指派林佳蓉"}</button>
              <button onClick={() => runAction("指派變更", locale === "en" ? "Manager assigned ticket ownership to Brian Chang." : "主管已將案件 Owner 指派給張柏翰。", { assignee: "張柏翰" })}>{locale === "en" ? "Assign Brian" : "指派張柏翰"}</button>
              <button onClick={() => runAction("優先級調整", locale === "en" ? "Manager changed ticket priority to High." : "主管已將案件優先級調整為高。", { priority: "高" })}>{locale === "en" ? "Mark high priority" : "標記高優先"}</button>
            </>
          )}
        </div>
      </section>

      <div className="detail-workbench">
        <aside className="ticket-left-rail">
          <div className="rail-section">
            <h2>{text.detail.caseFields}</h2>
            {(handoffBlock && (supportCase.status === "待二線客服處理" || currentUser.role === "二線客服")) && (
              currentUser.role === "二線客服" ? (
                <div className="handoff-summary compact priority">
                  <div className="section-title">
                    <h3>{text.detail.handoffSummary}</h3>
                  </div>
                  <p>{handoffBlock}</p>
                </div>
              ) : (
                <details className="handoff-summary compact">
                  <summary>{text.detail.handoffSummary}</summary>
                  <p>{handoffBlock}</p>
                </details>
              )
            )}
            <EditablePropertyRow
              id="type"
              label={text.detail.type}
              value={getLocalizedCaseType(supportCase.type, locale, projectArea)}
              options={caseTypes}
              isOpen={openProperty === "type"}
              onToggle={() => setOpenProperty(openProperty === "type" ? null : "type")}
              optionLabel={(value) => getLocalizedCaseType(value as CaseType, locale, projectArea)}
              onSelect={(value) => updateCaseType(value as CaseType)}
            />
            <EditablePropertyRow
              id="subtype"
              label={text.detail.subtype}
              value={projectArea === "sea" || locale === "en" ? subtypeLabelsEn[supportCase.subtype] ?? supportCase.subtype : supportCase.subtype}
              options={subtypeOptions.includes(supportCase.subtype) ? subtypeOptions : [supportCase.subtype, ...subtypeOptions]}
              isOpen={openProperty === "subtype"}
              onToggle={() => setOpenProperty(openProperty === "subtype" ? null : "subtype")}
              optionLabel={(value) => projectArea === "sea" || locale === "en" ? subtypeLabelsEn[value] ?? value : value}
              onSelect={updateCaseSubtype}
            />
            <EditablePropertyRow
              id="priority"
              label={text.detail.priority}
              value={tPriority(supportCase.priority, locale)}
              options={priorities}
              isOpen={openProperty === "priority"}
              onToggle={() => setOpenProperty(openProperty === "priority" ? null : "priority")}
              optionLabel={(value) => tPriority(value as Priority, locale)}
              onSelect={(value) => updateCasePriority(value as Priority)}
              valueTone={`priority-${supportCase.priority}`}
            />
            {permissions.isOwner || permissions.canAssignCase ? (
              <EditablePropertyRow
                id="owner"
                label={text.detail.owner}
                value={getLocalizedAssigneeLabel(supportCase.assignee, locale, projectArea)}
                options={editableAgentOptions}
                isOpen={openProperty === "owner"}
                onToggle={() => setOpenProperty(openProperty === "owner" ? null : "owner")}
                optionLabel={(value) => getLocalizedAssigneeLabel(value, locale, projectArea)}
                onSelect={updateCaseOwner}
              />
            ) : (
              <Info label={text.detail.owner} value={getLocalizedAssigneeLabel(supportCase.assignee, locale, projectArea)} />
            )}
            {collaborators.length > 0 && <Info label={text.detail.collaborators} value={collaborators.map((person) => `${getDisplayAssigneeName(person.name, projectArea)} (${getLocalizedRoleLabel(person.role, locale, projectArea)})`).join(", ")} />}
            {!permissions.isOwner && !permissions.canAssignCase && collaboratorOptions.length > 0 && (
              <EditablePropertyRow
                id="collaborator"
                label={locale === "en" ? "Add collaborator" : "新增協作者"}
                value={locale === "en" ? "Select teammate" : "選擇同事"}
                options={collaboratorOptions}
                isOpen={openProperty === "collaborator"}
                onToggle={() => setOpenProperty(openProperty === "collaborator" ? null : "collaborator")}
                optionLabel={(value) => getLocalizedAssigneeLabel(value, locale, projectArea)}
                onSelect={addCollaborator}
                placeholder
              />
            )}
            <Info label={currentUser.role === "客服主管" ? text.detail.slaDue : getDeadlineColumnLabel(currentUser.role, locale)} value={supportCase.slaDueAt} />
            <Info label={text.detail.status} value={tStatus(supportCase.status, locale)} />
            <CaseStatusFlow
              supportCase={supportCase}
              events={events}
              relatedTickets={relatedTickets}
              projectArea={projectArea}
              locale={locale}
              canEscalateSecondLine={permissions.canEscalateSecondLine && getAssigneeRole(supportCase.assignee) === "一線客服"}
              onEscalateSecondLine={() => setHandoffOpen(true)}
            />
          </div>
          <div className="rail-section linked-ticket-section">
            <div className="rail-title-row">
              <h2>{text.detail.linkedTicket}</h2>
              {permissions.canCreateExternalTicket && (
                <button className="small-chip-button" onClick={() => setModalOpen(true)}>{text.detail.createTechTicket}</button>
              )}
            </div>
            {relatedTickets.length === 0 ? (
              <p className="muted">{text.detail.noTechTicket}</p>
            ) : relatedTickets.map((ticket) => (
              <div className="external-ticket-card" key={ticket.id}>
                <div className="external-ticket-head">
                  <strong>{ticket.id}</strong>
                  <span>{getExternalTicketStatus(ticket)}</span>
                </div>
                <Info label={text.detail.sourceSystem} value={getExternalTicketSystem(ticket)} />
                <Info label={text.detail.lastSync} value={getExternalTicketSyncedAt(ticket)} />
                <Info label={text.detail.engineer} value={ticket.assignee === "未指派" ? text.chips.unassigned : ticket.assignee} />
                <button className="ghost-button full-button" onClick={() => notify(locale === "en" ? `Opening external ticket ${ticket.id}` : `開啟外部工單 ${ticket.id}`)}>{text.detail.viewExternalTicket}</button>
              </div>
            ))}
            {canManageExternalTickets && (
              <div className="ticket-linker">
                <label>
                  <span>{text.detail.linkExternalTicket}</span>
                  <input
                    value={techTicketQuery}
                    onChange={(event) => setTechTicketQuery(event.target.value)}
                    placeholder={text.detail.linkExternalPlaceholder}
                  />
                </label>
                <div className="linkable-ticket-list">
                  {linkableTickets.length === 0 && <p className="muted">{text.detail.noLinkableTicket}</p>}
                  {linkableTickets.map((ticket) => (
                    <div className="linkable-ticket" key={ticket.id}>
                      <div>
                        <strong>{ticket.id}</strong>
                        <span>{ticket.title}</span>
                        <small>Jira · {getExternalTicketStatus(ticket)}</small>
                      </div>
                      <button onClick={() => linkExternalTicket(ticket)}>{text.detail.link}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </aside>

        <section className="ticket-conversation">
          <div className="discussion-header">
            <div>
              <p className="eyebrow">{text.detail.workspace}</p>
              <h2>{text.detail.records}</h2>
            </div>
            <span>{text.detail.recordsCount(conversationItems.length + internalNoteItems.length)}</span>
          </div>

          <div className="conversation-body">
            <div className="work-section customer-work">
              <div className="section-title">
                <h3>{text.detail.conversation}</h3>
                <span className="muted">{text.detail.customerCommunication}</span>
              </div>
              <div className="discussion-list">
                {conversationItems.map((item) => (
                  <div className={`discussion-item ${item.kind}`} key={item.id}>
                    <div className="discussion-meta">
                      <span>{item.label}</span>
                      <small>{item.actor} · {item.time}</small>
                    </div>
                    <p>{item.content}</p>
                  </div>
                ))}
              </div>
              {permissions.canReplyCustomer ? (
                <div className="composer-panel reply-composer primary-composer expanded">
                  <div className="reply-collapsed-row">
                    <h3>{text.detail.replyCustomer}</h3>
                  </div>
                  <div className="template-row" aria-label={text.detail.quickReplies}>
                    <button type="button" className="text-button" onClick={() => setReplyText(locale === "en" ? "Hi, we have received your request and are checking the latest status." : "您好，我們已收到您的問題，正在協助確認處理進度。")}>{text.detail.received}</button>
                    <button type="button" className="text-button" onClick={() => setReplyText(locale === "en" ? "Could you please provide a screenshot, transaction time, or order details so we can check further?" : "請您補充相關截圖、交易時間或訂單資訊，以利我們進一步確認。")}>{text.detail.needInfo}</button>
                    <button type="button" className="text-button" onClick={() => setReplyText(locale === "en" ? "The transaction is still processing. We will continue tracking it and update you once there is progress." : "您好，目前交易仍在處理中，我們會持續追蹤狀態並回覆您最新進度。")}>{text.detail.processing}</button>
                    <button type="button" className="text-button" onClick={() => setReplyText(locale === "en" ? "This issue has been resolved. Please reply if you still need help." : "此案件已處理完成，如仍有問題請再回覆我們。")}>{text.detail.completed}</button>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(event) => setReplyText(event.target.value)}
                    placeholder={text.detail.replyPlaceholder}
                  />
                  <div className="composer-footer">
                    <span className="muted">{text.detail.publicReplyNotice}</span>
                    <button
                      type="button"
                      onClick={submitPublicReply}
                    >
                      {text.detail.sendPublicReply}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="composer-panel reply-composer disabled-composer">
                  <h3>{text.detail.replyCustomer}</h3>
                  <p className="muted">{text.detail.ownerOnlyReply}</p>
                </div>
              )}
            </div>

            <div className="work-section comments-work">
              <div className="record-tabs" role="tablist" aria-label="案件紀錄切換">
                <button className={recordTab === "comments" ? "active" : ""} onClick={() => setRecordTab("comments")}>Comments</button>
                <button className={recordTab === "history" ? "active" : ""} onClick={() => setRecordTab("history")}>{text.detail.history}</button>
              </div>

              {recordTab === "comments" ? (
                <div className="comments-panel">
                  <div className="section-title">
                    <div>
                      <h3>Comments</h3>
                      <span className="muted">{text.detail.internalNotice}</span>
                    </div>
                  </div>
                  <div className="discussion-list">
                    {commentEntries.length === 0 ? <p className="muted">{text.detail.noComments}</p> : commentEntries.map((entry) => (
                      entry.kind === "comment" ? (
                        <div className="comment-row" key={entry.item.id}>
                          <span className="comment-avatar">{entry.item.actor.slice(0, 1)}</span>
                          <div className="comment-content">
                            <div className="comment-meta">
                              <strong>{entry.item.actor}</strong>
                              <small>{entry.item.time}</small>
                            </div>
                            <p>{entry.item.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="comment-row" key={entry.ticket.id}>
                          <span className="comment-avatar">張</span>
                          <div className="comment-content">
                            <div className="comment-meta">
                              <strong>{locale === "en" ? "External ticket update" : "技術工單更新"}</strong>
                              <small>{getExternalTicketSyncedAt(entry.ticket)}</small>
                            </div>
                            <div className="external-ticket-update">
                              <strong>{entry.ticket.id}</strong>
                              <span>{locale === "en" ? "Status" : "狀態"}：{getExternalTicketPreviousStatus(entry.ticket)} → {getExternalTicketStatus(entry.ticket)}</span>
                              <span>{locale === "en" ? "Update" : "更新摘要"}：{getExternalTicketUpdateSummary(entry.ticket, locale)}</span>
                            </div>
                            <button className="text-button comment-link" onClick={() => notify(locale === "en" ? `Viewing external ticket ${entry.ticket.id}` : `查看外部工單 ${entry.ticket.id}`)}>{text.detail.viewExternalTicket}</button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  <div className={currentUser.role === "二線客服" ? "composer-panel note-composer primary-composer" : "composer-panel note-composer"}>
                    <div className="comment-composer-row">
                      <span className="comment-avatar">{currentUser.name.slice(0, 1)}</span>
                      <div className="comment-composer-box">
                        <textarea
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          placeholder={permissions.canComment ? text.detail.commentPlaceholder : text.detail.readOnlyComments}
                          disabled={!permissions.canComment}
                        />
                        <div className="composer-footer">
                          <span className="muted">{text.detail.commentsNotice}</span>
                          <button
                            disabled={!permissions.canComment}
                            onClick={() => {
                              runAction("新增內部備註", noteText.trim() || "新增 Comment：待確認案件細節與後續處理方式。");
                              setNoteText("");
                            }}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="history-panel">
                  <div className="section-title">
                    <h3>{text.detail.history}</h3>
                    <span className="muted">{locale === "en" ? "System events and workflow status" : "系統事件與流程狀態"}</span>
                  </div>
                  <Timeline events={activityEvents} compact limit={10} projectArea={projectArea} locale={locale} />
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="toolbox-rail" aria-label="工具箱">
          <div className="rail-section customer-card side-customer-card">
            <div className="rail-title-row">
                  <h2>{text.detail.customerProfile}</h2>
              <button
                className="icon-button subtle"
                onClick={() => copyToClipboard([
                  `${locale === "en" ? "Name" : "姓名"}：${shownCase.customerName}`,
                  `User ID：${supportCase.userId}`,
                  `Email：${shownCase.email}`,
                  `${locale === "en" ? "Region" : "所在地區"}：${tRegion(projectArea, locale)}`,
                  `${locale === "en" ? "Member tier" : "會員等級"}：${getMemberTier(supportCase.userId)}`,
                ].join("\n"), notify, locale)}
                aria-label={text.detail.copyCustomer}
                title={text.detail.copyCustomer}
              >
                ⧉
              </button>
            </div>
            <div className="customer-profile">
              <span>{shownCase.customerName.slice(0, 1)}</span>
              <div>
                <strong>{shownCase.customerName}</strong>
                <small>User ID：{supportCase.userId}</small>
              </div>
            </div>
            <Info label="Email" value={shownCase.email} />
            <Info label={text.detail.region} value={tRegion(projectArea, locale)} />
            <Info label={text.detail.tier} value={getMemberTier(supportCase.userId)} />
          </div>
          <div className="rail-section side-history-card">
            <h2>{text.detail.historyCases}</h2>
            <div className="history-list">
              {historyCases.length === 0 ? <p className="muted">{text.detail.noHistory}</p> : historyCases.map((item) => (
                <div className="history-item" key={item.id}>
                  <div>
                    <strong>{item.id}</strong>
                    <button className="icon-button subtle" onClick={() => onOpenCase(item.id)} aria-label={`${text.detail.openCase} ${item.id}`} title={text.detail.openCase}>↗</button>
                  </div>
                  <span>{getDisplayCaseType(item.type, projectArea)}</span>
                  <StatusBadge value={tStatus(item.status, locale)} />
                </div>
              ))}
            </div>
          </div>
          <div className="toolbox-rail-header">
            <p className="eyebrow">{text.detail.tools}</p>
            <h2>{text.detail.toolbox}</h2>
          </div>
          <details className="toolbox-section">
            <summary>{text.detail.cartPointsLookup}</summary>
            <CartPointsInvestigation
              supportCase={shownCase}
              transactions={transactions}
              currentUser={currentUser}
              canViewAdvanced={permissions.canViewAdvancedCartPoints}
              selectedTx={selectedTx}
              setSelectedTx={setSelectedTx}
              notify={notify}
              locale={locale}
            />
          </details>
          <details className="toolbox-section">
            <summary>{text.detail.knowledgeBase}</summary>
            <div className="knowledge-links">
              {getKnowledgeLinksForCase(supportCase).map((link) => (
                <button className="text-button" key={link}>{link}</button>
              ))}
            </div>
          </details>
        </aside>
      </div>

      {handoffOpen && (
        <div className="modal-backdrop">
          <div className="modal handoff-modal">
            <header>
              <h2>{text.modal.escalate}</h2>
              <button className="icon-button" onClick={() => setHandoffOpen(false)}>×</button>
            </header>
            <div className="handoff-assignment">
              <h3>{text.modal.assignment}</h3>
              <label>
                <input
                  type="radio"
                  checked={handoffMode === "指定二線客服"}
                  onChange={() => setHandoffMode("指定二線客服")}
                />
                {text.modal.assignSecondLine}
              </label>
              {handoffMode === "指定二線客服" && (
                <select value={handoffAssignee} onChange={(event) => setHandoffAssignee(event.target.value)}>
                  {agents.filter((agent) => agent.role === "二線客服").map((agent) => (
                    <option key={agent.id} value={agent.name}>{getDisplayAssigneeName(agent.name, projectArea)}</option>
                  ))}
                </select>
              )}
              <label>
                <input
                  type="radio"
                  checked={handoffMode === "放入二線待處理 Queue"}
                  onChange={() => setHandoffMode("放入二線待處理 Queue")}
                />
                {text.modal.queueSecondLine}
              </label>
            </div>
            <div className="handoff-grid">
              <div className="handoff-panel">
                <h3>{text.modal.caseSummary}</h3>
                <Info label={text.modal.caseType} value={getLocalizedCaseType(supportCase.type, locale, projectArea)} />
                <Info label={text.modal.caseId} value={supportCase.id} />
                <Info label={text.detail.subtype} value={shownCase.subtype} />
                <Info label={text.modal.customer} value={`${shownCase.customerName} / ${supportCase.userId}`} />
                <Info label="Email" value={shownCase.email} />
                <Info label={text.modal.currentStatus} value={tStatus(supportCase.status, locale)} />
                <Info label={text.modal.slaStatus} value={tSlaLabel(sla.label, locale)} />
                <Info label={text.modal.lastCustomerMessage} value={lastCustomerMessage} />
                <Info label={text.modal.lastAgentReply} value={lastAgentReply} />
              </div>
              <div className="handoff-panel">
                <h3>{text.modal.completedActions}</h3>
                <Checklist rows={[
                  [text.modal.checkedCustomer, true],
                  [text.modal.checkedHistory, historyCases.length > 0],
                  [text.modal.usedCartPoints, supportCase.isCartPoints && events.some((event) => event.type === "使用 CartPoints 排查工具")],
                  [text.modal.attachedSummary, supportCase.isCartPoints && events.some((event) => event.type === "附加查詢摘要")],
                  [text.modal.repliedCustomer, publicReplies.length > 0],
                ]} />
                {supportCase.isCartPoints && selectedTx && (
                  <div className="handoff-transaction">
                    <h3>{text.modal.lookupResult}</h3>
                    <Info label={text.modal.txId} value={selectedTx.id} />
                    <Info label={text.modal.txStatus} value={tTransactionStatus(selectedTx.status, locale)} />
                    <Info label={text.modal.duration} value={getTransactionDuration(selectedTx, locale)} />
                    <Info label={text.modal.pointsDelta} value={locale === "en" ? `${selectedTx.pointsDelta} pts` : `${selectedTx.pointsDelta} 點`} />
                    <Info label={text.modal.txSummary} value={selectedTx.summary} />
                  </div>
                )}
              </div>
            </div>
            <label>{text.modal.reason}<textarea value={handoffReason} onChange={(event) => setHandoffReason(event.target.value)} placeholder={text.modal.reasonPlaceholder} /></label>
            <label>{text.modal.note}<textarea value={handoffNote} onChange={(event) => setHandoffNote(event.target.value)} placeholder={text.modal.notePlaceholder} /></label>
            <label>{text.modal.ask}<textarea value={handoffAsk} onChange={(event) => setHandoffAsk(event.target.value)} placeholder={text.modal.askPlaceholder} /></label>
            <footer>
              <button className="ghost-button" onClick={() => setHandoffOpen(false)}>{text.modal.cancel}</button>
              <button onClick={submitHandoff}>{text.modal.submitEscalate}</button>
            </footer>
          </div>
        </div>
      )}

      {modalOpen && (
        <TechTicketModal
          supportCase={shownCase}
          selectedTx={selectedTx}
          locale={locale}
          onClose={() => setModalOpen(false)}
          onSubmit={(ticket) => {
            setTechTickets((current) => [ticket, ...current]);
            updateCase(supportCase.id, {
              status: "待技術支援",
              hasTechTicket: true,
              relatedTechTicketIds: [...supportCase.relatedTechTicketIds, ticket.id],
            });
            addEvent(supportCase.id, "建立技術工單", `已建立技術工單 ${ticket.id}，案件狀態更新為待技術支援。`);
            notify("技術工單已建立");
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function SupportAssistPanel({ supportCase }: { supportCase: SupportCase }) {
  const guidance = supportCase.type === "訂單問題"
    ? {
        sop: "訂單狀態異常 SOP",
        steps: ["確認訂單編號", "查看付款狀態", "查看物流狀態", "比對平台訂單與物流節點"],
        checklist: ["訂單編號", "付款完成時間", "物流單號", "顧客收件地區"],
        faq: ["訂單已出貨但未到貨", "付款成功但訂單未更新"],
      }
    : supportCase.type === "退款問題"
      ? {
          sop: "退款進度查詢 SOP",
          steps: ["確認付款通路", "查看退款申請時間", "查看金流退款批次", "確認是否已通知顧客"],
          checklist: ["付款通路", "退款申請時間", "退款金額", "退款批次"],
          faq: ["退款入帳時間", "退款狀態不同步"],
        }
      : {
          sop: "一般客服案件 SOP",
          steps: ["確認顧客描述", "查看帳號與裝置資訊", "檢查是否有重複案件", "確認目前服務狀態"],
          checklist: ["顧客描述", "User ID", "Email", "裝置或瀏覽器資訊"],
          faq: ["帳號問題基本排查", "系統問題資訊蒐集"],
        };

  return (
    <div className="context-card assist-panel">
      <div className="section-title">
        <h2>處理輔助</h2>
        <StatusBadge value={supportCase.type} />
      </div>
      <div className="assist-block">
        <span>對應 SOP</span>
        <strong>{guidance.sop}</strong>
      </div>
      <div className="assist-list">
        <span>SOP 步驟</span>
        {guidance.steps.map((item) => <p key={item}>• {item}</p>)}
      </div>
      <div className="assist-list">
        <span>必要檢查項目</span>
        {guidance.checklist.map((item) => <p key={item}>• {item}</p>)}
      </div>
      <div className="assist-list">
        <span>FAQ</span>
        {guidance.faq.map((item) => <p key={item}>• {item}</p>)}
      </div>
    </div>
  );
}

function CartPointsInvestigation({ supportCase, transactions, currentUser, canViewAdvanced, selectedTx, setSelectedTx, notify, locale }: {
  supportCase: SupportCase;
  transactions: CartPointsTransaction[];
  currentUser: UserProfile;
  canViewAdvanced: boolean;
  selectedTx: CartPointsTransaction | null;
  setSelectedTx: (tx: CartPointsTransaction) => void;
  notify: (text: string) => void;
  locale: Locale;
}) {
  const [userId, setUserId] = useState(supportCase.userId);
  const [email, setEmail] = useState(supportCase.email);
  const [transactionId, setTransactionId] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const related = transactions.filter((tx) =>
    (userId && tx.userId.includes(userId)) ||
    (email && tx.email.includes(email)) ||
    (transactionId && tx.id.includes(transactionId)) ||
    supportCase.relatedTransactionIds.includes(tx.id)
  );
  const uniqueTransactions = Array.from(new Map(related.map((tx) => [tx.id, tx])).values());
  const member = uniqueTransactions[0] ?? transactions.find((tx) => tx.userId === supportCase.userId);
  const latest = uniqueTransactions[0];
  const hasProcessing = uniqueTransactions.some((tx) => tx.status === "處理中");
  const hasTimeout = uniqueTransactions.some((tx) => tx.status === "逾時");
  const hasAbnormal = uniqueTransactions.some((tx) => ["需人工確認", "失敗"].includes(tx.status));
  const isAdvancedUser = canViewAdvanced;
  const activeTx = selectedTx ?? latest ?? null;
  const flowNodes = getTransactionFlow(activeTx);
  const analysis = getTransactionAnalysis(activeTx, locale);

  return (
    <div className="context-card cartpoints-investigation">
      <div className="section-title">
        <div>
          <h2>{locale === "en" ? "CartPoints lookup" : "CartPoints 查詢"}</h2>
        </div>
        {isAdvancedUser && <StatusBadge value={locale === "en" ? "Advanced details" : "進階資訊"} tone="orange" />}
      </div>

      <div className="cp-query-grid">
        <label>User ID<input value={userId} onChange={(event) => setUserId(event.target.value)} /></label>
        <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>{locale === "en" ? "Transaction ID" : "交易 ID"}<input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="TX-" /></label>
      </div>

      <div className="cp-summary-grid">
        <div><span>{locale === "en" ? "Current balance" : "目前點數餘額"}</span><strong>{member ? member.balance.toLocaleString() : "-"}</strong></div>
        <div><span>{locale === "en" ? "Latest status" : "最近交易狀態"}</span><strong>{latest ? tTransactionStatus(latest.status, locale) : locale === "en" ? "No data" : "無資料"}</strong></div>
        <div><span>{locale === "en" ? "Processing" : "處理中交易"}</span><strong>{hasProcessing ? locale === "en" ? "Yes" : "有" : locale === "en" ? "No" : "無"}</strong></div>
        <div><span>{locale === "en" ? "Timed out" : "逾時交易"}</span><strong>{hasTimeout ? locale === "en" ? "Yes" : "有" : locale === "en" ? "No" : "無"}</strong></div>
        <div><span>{locale === "en" ? "Possible exception" : "疑似異常"}</span><strong>{hasAbnormal ? locale === "en" ? "Needs review" : "需確認" : locale === "en" ? "None found" : "未發現"}</strong></div>
      </div>

      {activeTx ? (
        <div className="cp-result-summary">
          <div className="cp-card-head">
            <h3>{locale === "en" ? "CartPoints lookup result" : "CartPoints 查詢結果"}</h3>
            <button className="icon-button subtle" onClick={() => copyToClipboard(formatTransactionCopy(activeTx, locale), notify, locale)} aria-label={locale === "en" ? "Copy lookup result" : "複製查詢結果"}>⧉</button>
          </div>
          <Info label={locale === "en" ? "Transaction ID" : "交易 ID"} value={activeTx.id} />
          <Info label={locale === "en" ? "Status" : "狀態"} value={tTransactionStatus(activeTx.status, locale)} />
          <Info label={locale === "en" ? "Points delta" : "點數異動"} value={locale === "en" ? `${activeTx.pointsDelta} pts` : `${activeTx.pointsDelta} 點`} />
          <Info label={locale === "en" ? "Exception flag" : "異常標記"} value={["需人工確認", "逾時", "失敗"].includes(activeTx.status) ? locale === "en" ? "Yes" : "有" : locale === "en" ? "No" : "無"} />
          <button className="secondary-button" onClick={() => setDetailsOpen((value) => !value)}>
            {detailsOpen ? locale === "en" ? "Hide details" : "收合詳細資訊" : locale === "en" ? "View details" : "查看詳細資訊"}
          </button>
        </div>
      ) : <p className="muted">{locale === "en" ? "No matching CartPoints transactions found." : "查無符合的 CartPoints 交易資料"}</p>}

      {detailsOpen && activeTx && (
        <div className="cp-detail">
          <div className="cp-transaction-list">
            <h3>{locale === "en" ? "Transactions" : "交易列表"}</h3>
            {uniqueTransactions.map((tx) => (
              <button key={tx.id} className={activeTx.id === tx.id ? "cp-transaction active" : "cp-transaction"} onClick={() => setSelectedTx(tx)}>
                <div>
                  <strong>{tx.id}</strong>
                  <small>{tx.occurredAt} · {tTransactionType(tx.transactionType, locale)}</small>
                  <span>{tx.summary}</span>
                </div>
                <div>
                  <strong>{tx.pointsDelta > 0 ? "+" : ""}{tx.pointsDelta}</strong>
                  <StatusBadge value={tTransactionStatus(tx.status, locale)} />
                  <small>{tx.chainStatus}</small>
                </div>
              </button>
            ))}
          </div>
          <div className="cp-card-head">
            <h3>{locale === "en" ? "Transaction details" : "交易詳情"}</h3>
            <span className="cp-icon-actions">
              <button className="icon-button subtle" onClick={() => copyToClipboard(formatTransactionCopy(activeTx, locale), notify, locale)} aria-label={locale === "en" ? "Copy transaction details" : "複製交易詳情"}>⧉</button>
              <button className="icon-button subtle" onClick={() => notify(locale === "en" ? `Opening transaction platform: ${activeTx.id}` : `開啟交易平台：${activeTx.id}`)} aria-label={locale === "en" ? "Open transaction platform" : "開啟交易平台"}>↗</button>
            </span>
          </div>
          <Info label={locale === "en" ? "Transaction ID" : "交易 ID"} value={activeTx.id} />
          <Info label="User ID" value={activeTx.userId} />
          <Info label={locale === "en" ? "Transaction type" : "交易類型"} value={tTransactionType(activeTx.transactionType, locale)} />
          <Info label={locale === "en" ? "Transaction status" : "交易狀態"} value={tTransactionStatus(activeTx.status, locale)} />
          <Info label={locale === "en" ? "Chain status" : "鏈上狀態"} value={simplifyChainStatus(activeTx.chainStatus, locale)} />
          <Info label={locale === "en" ? "Created at" : "建立時間"} value={activeTx.occurredAt} />
          <Info label={locale === "en" ? "Duration" : "持續時間"} value={getTransactionDuration(activeTx, locale)} />
          <Info label={locale === "en" ? "Last updated" : "最後更新"} value={activeTx.updatedAt} />
          <Info label={locale === "en" ? "Points delta" : "點數異動"} value={locale === "en" ? `${activeTx.pointsDelta} pts` : `${activeTx.pointsDelta} 點`} />
          <Info label={locale === "en" ? "Summary" : "交易摘要"} value={activeTx.summary} />
          {["需人工確認", "逾時", "失敗"].includes(activeTx.status) && (
            <div className="recommendation-box alert-box">
              <span>{locale === "en" ? "Exception alert" : "異常提醒"}</span>
              <strong>{activeTx.status} · {activeTx.summary}</strong>
            </div>
          )}

          {isAdvancedUser && (
            <details className="cp-advanced">
              <summary>{locale === "en" ? "Advanced details" : "進階資訊"}</summary>
              <div>
                <h3>{locale === "en" ? "Transaction flow" : "交易流程節點"}</h3>
                <div className="flow-list">
                  {flowNodes.map((node) => (
                    <div className={`flow-node ${node.status}`} key={node.name}>
                      <span>{node.name}</span>
                      <strong>{locale === "en" ? node.label === "成功" ? "Success" : node.label === "處理中" ? "Processing" : node.label === "失敗" ? "Failed" : "Not run" : node.label}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div className="analysis-box">
                <h3>{locale === "en" ? "Exception analysis" : "異常分析"}</h3>
                <p>{analysis}</p>
              </div>
              <Info label={locale === "en" ? "Related transactions" : "關聯交易"} value={uniqueTransactions.filter((tx) => tx.id !== activeTx.id).slice(0, 2).map((tx) => tx.id).join(", ") || (locale === "en" ? "None" : "無")} />
              <Info label={locale === "en" ? "Risk flags" : "風險標記"} value={getRiskFlag(activeTx, locale)} />
              <Info label={locale === "en" ? "Retry summary" : "Retry 紀錄摘要"} value={getRetrySummary(activeTx, locale)} />
              <Info label={locale === "en" ? "System reason" : "系統判定原因"} value={getSystemReason(activeTx, locale)} />
              <div className="secondline-conclusion">
                <h3>{locale === "en" ? "Second-line conclusion" : "二線處理結論"}</h3>
                <textarea placeholder={locale === "en" ? "Record the second-line assessment, whether engineering support is needed, and the response back to frontline support." : "記錄二線判斷、是否需技術支援，以及回覆一線客服的處理結論。"} />
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

function simplifyChainStatus(status: string, locale: Locale = "zh") {
  if (locale === "en") {
    if (status.includes("確認")) return "Confirming or confirmed";
    if (status.includes("回滾")) return "Rolled back";
    if (status.includes("pending")) return "Chain processing timeout";
    return status;
  }
  if (status.includes("確認")) return "鏈上確認中或已確認";
  if (status.includes("回滾")) return "交易已回滾";
  if (status.includes("pending")) return "鏈上處理逾時";
  return status;
}

function formatTransactionCopy(tx: CartPointsTransaction, locale: Locale = "zh") {
  if (locale === "en") {
    return [
      `Transaction ID: ${tx.id}`,
      `User ID: ${tx.userId}`,
      `Transaction type: ${tTransactionType(tx.transactionType, locale)}`,
      `Transaction status: ${tTransactionStatus(tx.status, locale)}`,
      `Chain status: ${tx.chainStatus}`,
      `Created at: ${tx.occurredAt}`,
      `Last updated: ${tx.updatedAt}`,
      `Points delta: ${tx.pointsDelta} pts`,
      `Summary: ${tx.summary}`,
    ].join("\n");
  }
  return [
    `交易 ID：${tx.id}`,
    `User ID：${tx.userId}`,
    `交易類型：${tx.transactionType}`,
    `交易狀態：${tx.status}`,
    `鏈上狀態：${tx.chainStatus}`,
    `建立時間：${tx.occurredAt}`,
    `最後更新：${tx.updatedAt}`,
    `點數異動：${tx.pointsDelta} 點`,
    `摘要：${tx.summary}`,
  ].join("\n");
}

function getTransactionDuration(tx: CartPointsTransaction, locale: Locale = "zh") {
  if (locale === "en") {
    if (tx.status === "處理中") return "Over 20 minutes";
    if (tx.status === "逾時") return "Over 24 hours";
    return "Completed or ended";
  }
  if (tx.status === "處理中") return "約 20 分鐘以上";
  if (tx.status === "逾時") return "超過 24 小時";
  return "已完成或已結束";
}

function getTransactionAnalysis(tx: CartPointsTransaction | null, locale: Locale = "zh") {
  if (!tx) return locale === "en" ? "No transaction selected." : "尚未選擇交易。";
  if (locale === "en") {
    if (tx.status === "處理中") return "The transaction has exceeded the usual real-time sync window. Check whether it is blocked at chain confirmation or status sync.";
    if (tx.status === "失敗") return "The transaction failed, but the frontend balance cache may not have refreshed after rollback.";
    if (tx.status === "需人工確認") return "The transaction matched a manual review rule. Confirm the member context and whether this may be unauthorized.";
    if (tx.status === "逾時") return "The transaction exceeded the normal processing threshold. Second-line should decide whether engineering support is needed.";
    return "Transaction status is normal and ledger data matches chain information.";
  }
  if (tx.status === "處理中") return "交易已超過一般即時同步時間，需確認是否卡在鏈上確認或狀態同步節點。";
  if (tx.status === "失敗") return "交易失敗但前台餘額可能尚未完成快取更新，需確認回滾後餘額同步。";
  if (tx.status === "需人工確認") return "交易命中人工確認規則，需確認會員操作情境與是否疑似未授權轉出。";
  if (tx.status === "逾時") return "交易已超過正常處理時間，需二線判斷是否轉技術支援處理重送或回補。";
  return "交易狀態正常，帳務與鏈上資訊一致。";
}

function getSystemReason(tx: CartPointsTransaction, locale: Locale = "zh") {
  if (locale === "en") {
    if (tx.status === "處理中") return "Chain confirmation or frontend status sync is not complete.";
    if (tx.status === "失敗") return "Balance cache may not have refreshed after rollback.";
    if (tx.status === "需人工確認") return "Risk rules were triggered and require manual review.";
    if (tx.status === "逾時") return "The transaction passed the processing threshold without a final result.";
    return "The transaction passed the full flow.";
  }
  if (tx.status === "處理中") return "鏈上確認或前台狀態同步尚未完成。";
  if (tx.status === "失敗") return "交易回滾後餘額快取可能尚未刷新。";
  if (tx.status === "需人工確認") return "風險規則命中，需人工判斷操作是否合理。";
  if (tx.status === "逾時") return "交易超過處理門檻仍未取得最終結果。";
  return "交易已通過完整流程。";
}

function getRiskFlag(tx: CartPointsTransaction, locale: Locale) {
  if (locale === "en") {
    if (tx.status === "需人工確認") return "Possible unauthorized use / identity check needed";
    if (tx.status === "失敗") return "Rollback completed; cache pending verification";
    return "Standard monitoring";
  }
  return tx.status === "需人工確認" ? "疑似未授權 / 需身份確認" : tx.status === "失敗" ? "回滾後快取待確認" : "一般追蹤";
}

function getRetrySummary(tx: CartPointsTransaction, locale: Locale) {
  if (locale === "en") {
    if (tx.status === "處理中") return "Retry not triggered yet; waiting for threshold.";
    if (tx.status === "失敗") return "Rolled back; confirm whether a new transaction is needed.";
    return "No retry needed.";
  }
  return tx.status === "處理中" ? "尚未觸發 retry，等待確認門檻" : tx.status === "失敗" ? "已回滾，需確認是否重建交易" : "無需 retry";
}

function getTransactionFlow(tx: CartPointsTransaction | null) {
  const pending = { status: "pending", label: "處理中" };
  const success = { status: "success", label: "成功" };
  const failed = { status: "failed", label: "失敗" };
  const skipped = { status: "skipped", label: "未執行" };
  const names = ["交易建立", "風控驗證", "點數扣除", "鏈上確認", "點數入帳", "狀態同步"];
  if (!tx) return names.map((name) => ({ name, ...skipped }));
  if (tx.status === "已完成") return names.map((name) => ({ name, ...success }));
  if (tx.status === "失敗") return names.map((name, index) => ({ name, ...(index < 3 ? success : index === 3 ? failed : skipped) }));
  if (tx.status === "需人工確認") return names.map((name, index) => ({ name, ...(index < 4 ? success : index === 4 ? pending : skipped) }));
  return names.map((name, index) => ({ name, ...(index < 3 ? success : index === 3 ? pending : skipped) }));
}

function Checklist({ rows }: { rows: Array<[string, boolean]> }) {
  return (
    <div className="checklist">
      {rows.map(([label, done]) => (
        <div key={label}>
          <span>{done ? "✓" : "—"}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </div>
  );
}

function TechTicketModal({ supportCase, selectedTx, locale, onClose, onSubmit }: {
  supportCase: SupportCase;
  selectedTx: CartPointsTransaction | null;
  locale: Locale;
  onClose: () => void;
  onSubmit: (ticket: TechTicket) => void;
}) {
  const [form, setForm] = useState({
    title: locale === "en" ? `${supportCase.title} investigation` : `${supportCase.title} 技術排查`,
    description: locale === "en" ? "Please verify transaction status, chain records, and member points ledger consistency." : "請協助確認交易狀態、鏈上紀錄與會員點數帳務一致性。",
    priority: supportCase.priority,
    assignee: "Alex Chen",
  });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header>
          <h2>{locale === "en" ? "Create external ticket" : "建立技術工單"}</h2>
          <button className="icon-button" onClick={onClose}>×</button>
        </header>
        <label>{locale === "en" ? "External ticket title" : "技術工單標題"}<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label>{locale === "en" ? "Issue description" : "問題描述"}<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label>{locale === "en" ? "Linked support ticket" : "關聯客服案件"}<input value={supportCase.id} readOnly /></label>
        <label>{locale === "en" ? "Linked CartPoints transaction" : "關聯 CartPoints 交易"}<input value={selectedTx?.id ?? (locale === "en" ? "Not selected" : "未選擇")} readOnly /></label>
        <label>{locale === "en" ? "Priority" : "優先級"}<select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>{priorities.map((item) => <option key={item} value={item}>{tPriority(item, locale)}</option>)}</select></label>
        <label>{locale === "en" ? "Source system" : "來源系統"}<input value="Jira" readOnly /></label>
        <label>{locale === "en" ? "External engineer" : "外部負責工程師"}<input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} /></label>
        <footer>
          <button className="ghost-button" onClick={onClose}>{locale === "en" ? "Cancel" : "取消"}</button>
          <button onClick={() => onSubmit({
            id: `ENG-${Math.floor(1200 + Math.random() * 80)}`,
            title: form.title,
            description: form.description,
            status: "待處理",
            priority: form.priority,
            assignee: form.assignee,
            updatedAt: nowText(),
            linkedCaseIds: [supportCase.id],
            linkedTransactionIds: selectedTx ? [selectedTx.id] : [],
          })}>{locale === "en" ? "Submit" : "送出"}</button>
        </footer>
      </div>
    </div>
  );
}

function Dashboard({ cases, dashboardFilter, setDashboardFilter, onSelect, locale }: {
  cases: SupportCase[];
  dashboardFilter: string | null;
  setDashboardFilter: (value: string | null) => void;
  onSelect: (id: string) => void;
  locale: Locale;
}) {
  const isEnglish = locale === "en";
  const openCases = cases.filter(isOpenCase);
  const overdueCases = openCases.filter((item) => item.overdue || getSlaWorkMeta(item).rank === 0);
  const dueSoonCases = openCases.filter((item) => !item.overdue && hoursUntil(item.slaDueAt) <= 24);
  const highPriorityCases = openCases.filter(hasHighPriority);
  const customerWaitingCases = openCases.filter((item) => item.status === "待顧客回覆" && getElapsedHours(item.updatedAt) > 24);
  const secondLineCases = openCases.filter((item) => item.status === "待二線客服處理");
  const techCases = openCases.filter((item) => item.status === "待技術支援" || item.status === "技術排查中");
  const techOver48Cases = techCases.filter((item) => getElapsedHours(item.updatedAt) > 48);
  const manualTxCount = transactions.filter((tx) => tx.status === "需人工確認").length;
  const secondLineAverageWait = averageHours(secondLineCases.map((item) => getElapsedHours(item.updatedAt)));
  const techAverageWait = averageHours(techCases.map((item) => getElapsedHours(item.updatedAt)));
  const externalTicketCount = cases.filter((item) => item.hasTechTicket).length;
  const processStatusOrder: CaseStatus[] = ["待受理", "處理中", "待顧客回覆", "待二線客服處理", "待技術支援", "技術排查中", "已解決"];
  const processCounts = processStatusOrder.map((status) => ({ label: tStatus(status, locale), value: cases.filter((item) => item.status === status).length }));
  const cartPointStatusCounts = ["處理中", "逾時", "失敗", "需人工確認", "已完成"].map((status) => ({
    label: tTransactionStatus(status, locale),
    value: transactions.filter((tx) => tx.status === status).length,
  }));
  const rawCartPointReasons = countBy(cases.filter((item) => item.isCartPoints), "subtype");
  const cartPointReasons = Object.fromEntries(Object.entries(rawCartPointReasons).map(([label, value]) => [
    isEnglish ? (subtypeLabelsEn[label] ?? label) : label,
    value,
  ]));

  const riskCards = [
    { label: isEnglish ? "SLA overdue" : "已超 SLA", value: overdueCases.length, helper: isEnglish ? "vs yesterday +2" : "較昨日 +2", filter: "overdueSla", tone: "danger", trend: "↑" },
    { label: isEnglish ? "Due within 24h" : "24 小時內即將超 SLA", value: dueSoonCases.length, helper: isEnglish ? "vs yesterday +1" : "較昨日 +1", filter: "due24", tone: "warning", trend: "↑" },
    { label: isEnglish ? "High-priority open" : "高優先未結案件", value: highPriorityCases.length, helper: isEnglish ? "vs yesterday -1" : "較昨日 -1", filter: "highPriority", tone: "warning", trend: "↓" },
    { label: isEnglish ? "Engineering wait > 48h" : "技術等待超過 48 小時", value: techOver48Cases.length, helper: isEnglish ? "vs yesterday +1" : "較昨日 +1", filter: "techOver48", tone: "danger", trend: "↑" },
  ];

  const selectedCases = getDashboardCasesByFilter(cases, dashboardFilter);
  const teamWorkload = agents
    .filter((agent) => agent.role === "一線客服" || agent.role === "二線客服")
    .map((agent) => {
      const assigned = openCases.filter((item) => item.assignee === agent.name);
      const overdue = assigned.filter((item) => item.overdue).length;
      const high = assigned.filter(hasHighPriority).length;
      return {
        name: agent.name,
        role: agent.role,
        open: assigned.length,
        overdue,
        high,
        score: assigned.length + overdue * 2 + high * 1.5,
      };
    })
    .sort((a, b) => b.score - a.score);
  const unassigned = openCases.filter((item) => item.assignee === "未指派").length;

  return (
    <section className="supervisor-dashboard ops-dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">Support Operations Dashboard</p>
          <h2>{isEnglish ? "Support Operations Center" : "案件營運中心"}</h2>
          <p>{isEnglish ? "Prioritized by operational risk, workflow health, team load, and special-case monitoring." : "依營運風險、流程健康度、團隊負載與特殊案件監控排序。"}</p>
        </div>
        <div className="dashboard-hero-actions">
          <div className="dashboard-hero-meta">
            <strong>{selectedCases.length}</strong>
            <span>{dashboardFilter ? (isEnglish ? "Filtered tickets" : "目前篩選案件") : (isEnglish ? "High-risk tickets" : "高風險案件")}</span>
          </div>
          <button className="export-button" onClick={() => exportDashboardCsv(cases, locale)}>Export CSV</button>
        </div>
      </header>

      <section className="dashboard-section ops-risk-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">{isEnglish ? "What needs attention now?" : "哪裡快爆炸了？"}</p>
            <h2>{isEnglish ? "Today's Operational Risks" : "今日營運風險"}</h2>
          </div>
          {dashboardFilter && <button className="ghost-button" onClick={() => setDashboardFilter(null)}>{isEnglish ? "Clear filter" : "清除篩選"}</button>}
        </div>
        <div className="risk-grid">
          {riskCards.map((card) => (
            <button key={card.filter} className={`risk-card ${card.tone} ${dashboardFilter === card.filter ? "active" : ""}`} onClick={() => setDashboardFilter(card.filter)}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
              <small><b>{card.trend}</b> {card.helper}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="dashboard-grid ops-grid">
        <section className="dashboard-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">{isEnglish ? "Where are tickets stuck?" : "案件卡在哪？"}</p>
              <h2>{isEnglish ? "Workflow Health" : "案件流程健康度"}</h2>
            </div>
          </div>
          <HorizontalProcessChart rows={processCounts} />
          <div className="ops-inline-metrics">
            <span>{isEnglish ? "Second-line avg wait" : "二線平均等待"} <strong className={secondLineAverageWait > 24 ? "alert-text" : ""}>{formatDuration(secondLineAverageWait, locale)}</strong></span>
            <span>{isEnglish ? "Engineering avg wait" : "技術平均等待"} <strong className={techAverageWait > 48 ? "alert-text" : ""}>{formatDuration(techAverageWait, locale)}</strong></span>
            <span>{isEnglish ? "External tickets" : "技術工單建立"} <strong>{externalTicketCount}</strong></span>
          </div>
        </section>

        <section className="dashboard-panel compact-team-panel">
          <div className="section-title">
            <div>
              <p className="eyebrow">{isEnglish ? "Who is overloaded?" : "誰快超載？"}</p>
              <h2>{isEnglish ? "Team Workload" : "團隊工作負載"}</h2>
            </div>
            <span className="pill">{isEnglish ? `Unassigned ${unassigned}` : `未指派 ${unassigned} 件`}</span>
          </div>
          <div className="team-load-list compact">
            {teamWorkload.map((item) => (
              <div className="team-load-row" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{getLocalizedRoleLabel(item.role, locale, locale === "en" ? "sea" : "tw")}</span>
                </div>
                <div className="load-bars">
                  <span style={{ width: `${Math.min(item.open * 18, 100)}%` }}>{isEnglish ? "Open" : "未結"} {item.open}</span>
                  <span className="danger" style={{ width: `${Math.min(item.overdue * 28, 100)}%` }}>{isEnglish ? "Overdue" : "超時"} {item.overdue}</span>
                  <span className="warning" style={{ width: `${Math.min(item.high * 28, 100)}%` }}>{isEnglish ? "High" : "高優先"} {item.high}</span>
                </div>
                <strong>{Math.round(item.score)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel cartpoints-monitor">
        <div className="section-title">
          <div>
            <p className="eyebrow">{isEnglish ? "Which abnormality is most common?" : "哪種異常最多？"}</p>
            <h2>{isEnglish ? "CartPoints Monitoring" : "CartPoints 監控"}</h2>
          </div>
          <span className="pill">{isEnglish ? `Manual review ${manualTxCount}` : `需人工確認 ${manualTxCount} 筆`}</span>
        </div>
        <div className="cartpoints-monitor-grid">
          <PieStatusChart rows={cartPointStatusCounts} locale={locale} />
          <TopReasonList items={cartPointReasons} locale={locale} />
        </div>
      </section>

      <section className="dashboard-panel attention-panel">
        <div className="section-title">
          <div>
            <p className="eyebrow">{isEnglish ? "Which ticket should be handled first?" : "現在該先處理哪一件？"}</p>
            <h2>{isEnglish ? "High-risk Tickets" : "高風險案件"}</h2>
          </div>
          <span>{isEnglish ? `${selectedCases.length} tickets` : `${selectedCases.length} 件`}</span>
        </div>
        <div className="attention-table">
          <div className="attention-head">
            <span>{isEnglish ? "Ticket ID" : "案件編號"}</span>
            <span>{isEnglish ? "Title" : "標題"}</span>
            <span>{isEnglish ? "Status" : "狀態"}</span>
            <span>{isEnglish ? "Priority" : "優先級"}</span>
            <span>{isEnglish ? "Owner" : "負責人"}</span>
            <span>{isEnglish ? "SLA remaining" : "SLA 剩餘時間"}</span>
          </div>
          {selectedCases.map((item) => (
            <button className="attention-row" key={item.id} onClick={() => onSelect(item.id)}>
              <strong>{item.id}</strong>
              <span>{item.title}</span>
              <StatusBadge value={tStatus(item.status, locale)} />
              <PriorityBadge value={item.priority} locale={locale} />
              <span>{getLocalizedAssigneeLabel(item.assignee, locale, locale === "en" ? "sea" : "tw")}</span>
              <StatusBadge value={tSlaLabel(getSlaWorkMeta(item).label, locale)} tone={getSlaWorkMeta(item).tone} />
            </button>
          ))}
          {selectedCases.length === 0 && <p className="empty-state">{isEnglish ? "No high-risk tickets match the current filter." : "目前沒有符合條件的高風險案件。"}</p>}
        </div>
      </section>
    </section>
  );
}

function getDashboardCasesByFilter(cases: SupportCase[], filter: string | null) {
  const openCases = cases.filter(isOpenCase);
  const defaultAttention = openCases.filter((item) =>
    item.overdue ||
    hasHighPriority(item) ||
    (item.status === "待二線客服處理" && getElapsedHours(item.updatedAt) > 24) ||
    ((item.status === "待技術支援" || item.status === "技術排查中") && getElapsedHours(item.updatedAt) > 48) ||
    caseNeedsManualCartPoints(item, transactions)
  );

  const selected = filter === "overdueSla" ? openCases.filter((item) => item.overdue || getSlaWorkMeta(item).rank === 0) :
    filter === "due24" ? openCases.filter((item) => !item.overdue && hoursUntil(item.slaDueAt) <= 24) :
    filter === "highPriority" ? openCases.filter(hasHighPriority) :
    filter === "customerWaiting24" ? openCases.filter((item) => item.status === "待顧客回覆" && getElapsedHours(item.updatedAt) > 24) :
    filter === "secondLine" ? openCases.filter((item) => item.status === "待二線客服處理") :
    filter === "techSupport" ? openCases.filter((item) => item.status === "待技術支援" || item.status === "技術排查中") :
    filter === "techOver48" ? openCases.filter((item) => (item.status === "待技術支援" || item.status === "技術排查中") && getElapsedHours(item.updatedAt) > 48) :
    filter === "cartpoints" || filter === "cartpointsResolution" ? openCases.filter((item) => item.isCartPoints) :
    filter === "manualTx" ? openCases.filter((item) => item.relatedTransactionIds.some((id) => transactions.find((tx) => tx.id === id)?.status === "需人工確認")) :
    filter === "abnormalTx" ? openCases.filter((item) => caseNeedsManualCartPoints(item, transactions)) :
    filter === "firstResponse" || filter === "resolutionTime" ? openCases :
    defaultAttention;

  return [...selected].sort((a, b) => {
    const aScore = getSupervisorSortScore(a);
    const bScore = getSupervisorSortScore(b);
    return aScore - bScore || getElapsedHours(b.updatedAt) - getElapsedHours(a.updatedAt);
  });
}

function exportDashboardCsv(cases: SupportCase[], locale: Locale = "zh") {
  const isEnglish = locale === "en";
  const rows = [
    (isEnglish ? ["Ticket ID", "Title", "Owner", "Status", "Priority", "SLA due at", "Overdue"] : ["案件編號", "案件標題", "負責人", "案件狀態", "優先級", "SLA 到期時間", "是否超時"]).join(","),
    ...cases.map((item) => [
      item.id,
      item.title,
      getLocalizedAssigneeLabel(item.assignee, locale, locale === "en" ? "sea" : "tw"),
      tStatus(item.status, locale),
      tPriority(item.priority, locale),
      item.slaDueAt,
      item.overdue ? (isEnglish ? "Yes" : "是") : (isEnglish ? "No" : "否"),
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${rows}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `cartcare-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getSupervisorSortScore(item: SupportCase) {
  if (item.overdue || getSlaWorkMeta(item).rank === 0) return 0;
  if (hasHighPriority(item)) return 1;
  if (item.status === "待二線客服處理" && getElapsedHours(item.updatedAt) > 24) return 2;
  if ((item.status === "待技術支援" || item.status === "技術排查中") && getElapsedHours(item.updatedAt) > 48) return 3;
  if (caseNeedsManualCartPoints(item, transactions)) return 4;
  return 5;
}

function getSupervisorBlocker(item: SupportCase) {
  if (item.status === "待二線客服處理") return "待二線接手";
  if (item.status === "待技術支援" || item.status === "技術排查中") return "待技術回覆";
  if (item.status === "待顧客回覆") return "等待顧客補件";
  if (item.assignee === "未指派") return "尚未指派";
  if (caseNeedsManualCartPoints(item, transactions)) return "CartPoints 異常";
  return getProcessStage(item).label;
}

function getElapsedHours(value: string) {
  const time = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, (Date.now() - time) / 36e5);
}

function hoursUntil(value: string) {
  const time = new Date(value.replace(" ", "T")).getTime();
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return (time - Date.now()) / 36e5;
}

function averageHours(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatDuration(hours: number, locale: Locale = "zh") {
  if (!Number.isFinite(hours) || hours <= 0) return locale === "en" ? "0h" : "0 小時";
  if (hours < 24) return locale === "en" ? `${Math.max(1, Math.round(hours))}h` : `${Math.max(1, Math.round(hours))} 小時`;
  const days = Math.floor(hours / 24);
  const restHours = Math.round(hours % 24);
  return locale === "en" ? `${days}d ${restHours}h` : `${days} 天 ${restHours} 小時`;
}

function HorizontalProcessChart({ rows }: { rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <div className="process-chart">
      {rows.map((row) => (
        <div className="process-row" key={row.label}>
          <span>{row.label}</span>
          <div><i style={{ width: `${(row.value / max) * 100}%` }} /></div>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  );
}

function PieStatusChart({ rows, locale }: { rows: Array<{ label: string; value: number }>; locale: Locale }) {
  const total = Math.max(rows.reduce((sum, row) => sum + row.value, 0), 1);
  let cursor = 0;
  const colors = ["#60a5fa", "#ef4444", "#f97316", "#a855f7", "#22c55e"];
  const slices = rows.map((row, index) => {
    const start = cursor;
    const end = cursor + (row.value / total) * 100;
    cursor = end;
    return `${colors[index]} ${start}% ${end}%`;
  }).join(", ");

  return (
    <div className="pie-status">
      <div className="pie-chart" style={{ background: `conic-gradient(${slices})` }}>
        <strong>{total}</strong>
        <span>{locale === "en" ? "Transactions" : "交易"}</span>
      </div>
      <div className="pie-legend">
        {rows.map((row, index) => (
          <span key={row.label}><i style={{ background: colors[index] }} />{row.label} {row.value}</span>
        ))}
      </div>
    </div>
  );
}

function TopReasonList({ items, locale }: { items: Record<string, number>; locale: Locale }) {
  const sorted = Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 4);
  return (
    <div className="top-reasons">
      <h3>{locale === "en" ? "Top Abnormal Reasons" : "Top 異常原因"}</h3>
      {sorted.map(([label, value]) => (
        <div key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function getExternalTicketSystem(_ticket: TechTicket) {
  return "Jira";
}

function getExternalTicketStatus(ticket: TechTicket) {
  const map: Record<string, string> = {
    待指派: "To Do",
    待處理: "To Do",
    處理中: "In Progress",
    待驗證: "Ready for Verification",
    已完成: "Done",
    已取消: "Canceled",
  };
  return map[ticket.status] ?? ticket.status;
}

function getExternalTicketPreviousStatus(ticket: TechTicket) {
  if (ticket.status === "待驗證") return "In Progress";
  if (ticket.status === "處理中") return "To Do";
  if (ticket.status === "已完成") return "Ready for Verification";
  return "Created";
}

function getExternalTicketCreatedAt(ticket: TechTicket) {
  if (ticket.id === "ENG-1188") return "2026-06-08 15:22";
  if (ticket.id === "ENG-1192") return "2026-06-06 11:15";
  return "2026-06-06 14:30";
}

function getExternalTicketSyncedAt(ticket: TechTicket) {
  if (ticket.id === "ENG-1188") return "2026-06-09 10:30";
  return ticket.updatedAt;
}

function getExternalTicketUpdateSummary(ticket: TechTicket, locale: Locale = "zh") {
  if (locale === "en") {
    if (ticket.id === "ENG-1188") return "Chain synchronization check is complete. Waiting for support to verify the member balance.";
    if (ticket.id === "ENG-1192") return "The API timeout cause has been identified. Waiting for support to confirm whether the frontend transaction history has recovered.";
    return "The external ticket has been created and is waiting for the next update from Jira.";
  }
  if (ticket.id === "ENG-1188") return "已完成鏈上同步檢查，等待客服驗證會員餘額。";
  if (ticket.id === "ENG-1192") return "API 逾時原因已定位，等待客服確認前台交易紀錄是否恢復。";
  return "外部工單已建立，等待外部系統回傳最新狀態。";
}

function KnowledgeBase({ locale }: { locale: Locale }) {
  const isEnglish = locale === "en";
  const articles = isEnglish ? [
    { title: "CartPoints transaction status guide", category: "CartPoints", updated: "2026-06-08", summary: "How support should read processing, timed out, failed, and manual-review transaction statuses." },
    { title: "Delayed points transfer checklist", category: "CartPoints", updated: "2026-06-06", summary: "Required checks when a customer reports a delayed CartPoints transfer." },
    { title: "Order status sync workflow", category: "Order", updated: "2026-06-04", summary: "Verification sequence for paid orders that did not update correctly." },
    { title: "Refund progress reply templates", category: "Refund", updated: "2026-06-02", summary: "Refund processing timelines, payment sync checks, and customer reply examples." },
    { title: "Second-line transfer format", category: "Collaboration", updated: "2026-06-01", summary: "What to include when transferring a ticket to second-line support." },
  ] : [
    { title: "CartPoints 交易狀態判讀", category: "CartPoints", updated: "2026-06-08", summary: "處理中、逾時、需人工確認等交易狀態的客服判讀方式。" },
    { title: "點數轉讓延遲客服 SOP", category: "CartPoints", updated: "2026-06-06", summary: "一線客服接到點數轉讓延遲案件時的檢查項目。" },
    { title: "訂單狀態未同步處理流程", category: "訂單", updated: "2026-06-04", summary: "付款成功但訂單狀態未更新時的查核順序。" },
    { title: "退款進度查詢回覆範本", category: "退款", updated: "2026-06-02", summary: "退款處理時間、金流同步與顧客回覆範例。" },
    { title: "升級二線客服交接格式", category: "協作", updated: "2026-06-01", summary: "升級案件時需要保留的案件摘要與排查紀錄。" },
  ];

  return (
    <section className="knowledge-page">
      <div className="knowledge-hero">
        <div>
          <p className="eyebrow">{isEnglish ? "Support documentation" : "客服支援文件"}</p>
          <h2>{isEnglish ? "Knowledge base" : "知識庫"}</h2>
        </div>
        <input aria-label={isEnglish ? "Search knowledge base" : "搜尋知識庫"} placeholder={isEnglish ? "Search guides, FAQs, or workflows" : "搜尋 SOP、FAQ 或處理流程"} />
      </div>
      <div className="knowledge-grid">
        {articles.map((article) => (
          <button className="knowledge-card" key={article.title}>
            <span>{article.category}</span>
            <strong>{article.title}</strong>
            <p>{article.summary}</p>
            <small>{isEnglish ? "Last updated" : "最後更新"}：{article.updated}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function CaseStatusFlow({ supportCase, events, relatedTickets, projectArea, locale, canEscalateSecondLine, onEscalateSecondLine }: {
  supportCase: SupportCase;
  events: TimelineEvent[];
  relatedTickets: TechTicket[];
  projectArea: ProjectArea;
  locale: Locale;
  canEscalateSecondLine?: boolean;
  onEscalateSecondLine?: () => void;
}) {
  const steps = getOwnershipFlowSteps(supportCase, events, relatedTickets, projectArea, locale);
  return (
    <div className="status-flow" aria-label={locale === "en" ? "Ticket status flow" : "案件狀態流程"}>
      <span className="status-flow-label">Progress Timeline</span>
      <div>
        {steps.map((step) => (
          <div className={`status-step ${step.state} ${canEscalateSecondLine && step.kind === "second-line" ? "with-action" : ""}`} key={step.label}>
            <span></span>
            <div>
              <strong>{step.label}</strong>
              {step.meta && <small>{step.meta}</small>}
            </div>
            {canEscalateSecondLine && step.kind === "second-line" && onEscalateSecondLine && (
              <button className="small-chip-button status-step-button" onClick={onEscalateSecondLine}>{locale === "en" ? "Transfer" : "移交二線客服"}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getOwnershipFlowSteps(item: SupportCase, events: TimelineEvent[], relatedTickets: TechTicket[], projectArea: ProjectArea, locale: Locale) {
  const ownerRole = getAssigneeRole(item.assignee);
  const frontlineActor = events.find((event) => getAssigneeRole(event.actor) === "一線客服")?.actor ?? (ownerRole === "一線客服" ? item.assignee : "一線客服");
  const secondLineActor = events.find((event) => getAssigneeRole(event.actor) === "二線客服")?.actor ?? (ownerRole === "二線客服" ? item.assignee : "");
  const resolvedEvent = events.find((event) => event.description.includes("已解決") || event.description.includes("marked as resolved"));
  const closedEvent = events.find((event) => event.type === "結案" || event.type === "關閉案件" || event.description.includes("已關閉"));
  const frontlineLabel = frontlineActor === "一線客服" ? getDisplayRoleLabel("一線客服", projectArea) : getDisplayAssigneeName(frontlineActor, projectArea);
  const secondLineLabel = secondLineActor ? getDisplayAssigneeName(secondLineActor, projectArea) : "";
  const frontlineRoleLabel = getLocalizedRoleLabel("一線客服", locale, projectArea);
  const secondLineRoleLabel = getLocalizedRoleLabel("二線客服", locale, projectArea);
  const hasSecondLine = ["待二線客服處理", "待技術支援", "技術排查中"].includes(item.status) ||
    ownerRole === "二線客服" ||
    events.some((event) => ["升級至二線客服", "二線處理結果", "二線分析完成"].includes(event.type));
  const hasTech = relatedTickets.length > 0 || ["待技術支援", "技術排查中"].includes(item.status);
  const isResolved = ["已解決", "已結案"].includes(item.status);
  const isClosedWithoutResolution = ["已關閉", "已取消"].includes(item.status);
  const resolvedActor = resolvedEvent?.actor ?? item.assignee;
  const closedActor = closedEvent?.actor ?? item.assignee;
  const resolvedActorLabel = getDisplayAssigneeName(resolvedActor, projectArea);
  const closedActorLabel = getDisplayAssigneeName(closedActor, projectArea);
  const resolvedLabel = hasSecondLine
    ? tStatus("已解決", locale)
    : locale === "en" ? "Resolved by frontline" : "一線解決";
  const terminalStep = isClosedWithoutResolution
    ? {
      kind: "closed",
      label: tStatus("已關閉", locale),
      meta: `${closedActorLabel} ${locale === "en" ? "closed the ticket" : "結束案件"}`,
    }
    : {
      kind: "resolved",
      label: resolvedLabel,
      meta: isResolved ? `${resolvedActorLabel} ${locale === "en" ? "marked resolved" : "標記完成"}` : "",
    };

  const rows: Array<{ kind: string; label: string; meta: string }> = [
    { kind: "created", label: tStatus("新建立", locale), meta: locale === "en" ? `System created ticket · ${item.createdAt}` : `系統建立案件 · ${item.createdAt}` },
    { kind: "frontline", label: item.status === "待顧客回覆" ? tStatus("待顧客回覆", locale) : tStatus("處理中", locale), meta: `${frontlineLabel} (${frontlineRoleLabel})` },
  ];

  if (hasSecondLine) {
    rows.push({
      kind: "second-line",
      label: locale === "en" ? "Second-line transfer" : "升級二線",
      meta: secondLineActor ? `${frontlineLabel} → ${secondLineLabel}` : `${frontlineLabel} → ${locale === "en" ? "Second-line queue" : projectArea === "sea" ? "Second-line Queue" : "二線待處理 Queue"}`,
    });
  }

  if (hasTech) {
    rows.push({
      kind: "engineering",
      label: item.status === "技術排查中" ? tStatus("技術排查中", locale) : tStatus("待技術支援", locale),
      meta: secondLineActor ? `${secondLineLabel} (${secondLineRoleLabel})${relatedTickets[0] ? ` · ${locale === "en" ? "Linked" : "已關聯"} ${relatedTickets[0].id}` : ""}` : locale === "en" ? "No external ticket linked" : "外部技術工單尚未建立",
    });
  }

  rows.push(terminalStep);

  const activeKind = isClosedWithoutResolution ? "closed" :
    item.status === "已解決" || item.status === "已結案" ? "resolved" :
    hasTech ? "engineering" :
    hasSecondLine ? "second-line" :
    ["處理中", "待顧客回覆"].includes(item.status) ? "frontline" :
    "created";
  const currentIndex = Math.max(0, rows.findIndex((row) => row.kind === activeKind));

  return rows.map((row, index) => ({
    ...row,
    state: index < currentIndex ? "done" : index === currentIndex ? "active" : "pending",
  }));
}

function getKnowledgeLinksForCase(item: SupportCase) {
  if (item.type === "CartPoints 點數問題") {
    return ["CartPoints 交易狀態判讀", "點數轉讓延遲客服 SOP", "點數餘額異常排查", "疑似未授權點數轉出處理"];
  }
  if (item.type === "訂單問題") {
    return ["訂單狀態未同步處理流程", "付款成功但訂單未更新", "物流狀態查核流程"];
  }
  if (item.type === "退款問題") {
    return ["退款進度查詢回覆範本", "退款與金流同步說明", "退款異常升級條件"];
  }
  if (item.type === "帳號問題") {
    return ["帳號登入問題排查", "會員資料確認流程", "帳號安全檢查項目"];
  }
  if (item.type === "系統問題") {
    return ["系統問題資訊蒐集", "App / Web 回報格式", "已知系統異常公告"];
  }
  return ["一般客服案件 SOP", "顧客資訊蒐集項目", "升級二線客服交接格式"];
}

function Timeline({ events, compact = false, limit, projectArea = "tw", locale = "zh" }: { events: TimelineEvent[]; compact?: boolean; limit?: number; projectArea?: ProjectArea; locale?: Locale }) {
  const ordered = [...events].sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit);
  return (
    <div className={compact ? "timeline compact" : "timeline"}>
      {ordered.length === 0 && <p className="timeline-empty">{locale === "en" ? "No ticket activity yet." : "尚無案件活動。"}</p>}
      {ordered.map((event) => (
        <div className="timeline-event" key={event.id}>
          <span className="timeline-dot"></span>
          <div className="timeline-card">
            <div className="timeline-card-head">
              <strong>{tEventType(event.type, locale)}</strong>
              <small>{event.time}</small>
            </div>
            <p>{tEventDescription(event, locale)}</p>
            <small>{getLocalizedAssigneeLabel(event.actor, locale, projectArea)}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function Distribution({ title, items }: { title: string; items: Record<string, number> }) {
  const max = Math.max(...Object.values(items), 1);
  return (
    <div className="panel">
      <h2>{title}</h2>
      {Object.entries(items).map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span>{label}</span>
          <div><i style={{ width: `${(value / max) * 100}%` }} /></div>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function WorkloadDistribution({ cases }: { cases: SupportCase[] }) {
  const rows = agents
    .filter((agent) => agent.role === "一線客服" || agent.role === "二線客服")
    .map((agent) => {
      const assigned = cases.filter((item) => isOpenCase(item) && item.assignee === agent.name);
      return {
        name: agent.name,
        open: assigned.length,
        overdue: assigned.filter((item) => item.overdue).length,
        high: assigned.filter(hasHighPriority).length,
      };
    });
  const max = Math.max(...rows.map((row) => row.open + row.overdue + row.high), 1);

  return (
    <div className="panel workload-distribution">
      <h2>各客服工作負載</h2>
      {rows.map((row) => (
        <div className="workload-dist-row" key={row.name}>
          <span>{row.name}</span>
          <div className="stacked-bar" aria-label={`${row.name} 工作負載`}>
            <i className="open" style={{ width: `${(row.open / max) * 100}%` }} />
            <i className="overdue" style={{ width: `${(row.overdue / max) * 100}%` }} />
            <i className="high" style={{ width: `${(row.high / max) * 100}%` }} />
          </div>
          <small>未結 {row.open} · 超時 {row.overdue} · 高優先 {row.high}</small>
        </div>
      ))}
    </div>
  );
}

function countBy<T, K extends keyof T>(items: T[], key: K) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[key]);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function Placeholder({ title, locale }: { title: string; locale: Locale }) {
  return <div className="placeholder"><h2>{title}</h2><p>{locale === "en" ? "This area is a prototype placeholder and can be expanded into a complete internal workflow later." : "此區塊為 prototype placeholder，後續可延伸成完整內部流程。"}</p></div>;
}

function EditablePropertyRow({
  id,
  label,
  value,
  options,
  optionLabel,
  isOpen,
  onToggle,
  onSelect,
  valueTone,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  optionLabel?: (value: string) => string;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  valueTone?: string;
  placeholder?: boolean;
}) {
  return (
    <div className={isOpen ? "editable-property open" : "editable-property"}>
      <button
        type="button"
        className="editable-property-trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-property-menu`}
      >
        <span>{label}</span>
        <strong className={valueTone ? `property-value ${valueTone}` : placeholder ? "property-value placeholder" : "property-value"}>{value}</strong>
        <b aria-hidden="true">⌄</b>
      </button>
      {isOpen && (
        <div className="editable-property-menu" id={`${id}-property-menu`} role="listbox">
          {options.map((option) => {
            const shown = optionLabel ? optionLabel(option) : option;
            return (
              <button
                type="button"
                key={option}
                role="option"
                aria-selected={shown === value}
                onClick={() => onSelect(option)}
              >
                {shown}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Select({ label, value, options, optionLabel, onChange }: { label: string; value: string; options: string[]; optionLabel?: (value: string) => string; onChange: (value: string) => void }) {
  return <label className="field-label">{label}<select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{optionLabel ? optionLabel(option) : option}</option>)}</select></label>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
}

function InfoAction({ label, value, actionLabel, onAction }: { label: string; value: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="info-row info-row-action">
      <span>{label}</span>
      <strong>{value}</strong>
      {actionLabel && onAction && <button className="small-chip-button" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function StatusBadge({ value, tone }: { value: string; tone?: string }) {
  const lower = value.toLowerCase();
  const computedTone = tone ?? (
    value.includes("技術") || lower.includes("engineering") || lower.includes("second-line") ? "blue" :
    value.includes("已") || lower.includes("resolved") || lower.includes("closed") || lower.includes("completed") || lower.includes("done") ? "green" :
    value.includes("逾時") || value.includes("失敗") || lower.includes("overdue") || lower.includes("failed") || lower.includes("timed out") ? "red" :
    value.includes("待") || lower.includes("waiting") || lower.includes("pending") ? "amber" :
    "gray"
  );
  return <span className={`badge ${computedTone}`}>{value}</span>;
}

function PriorityBadge({ value, locale = "zh" }: { value: Priority; locale?: Locale }) {
  return <span className={`badge ${value === "緊急" ? "red" : value === "高" ? "orange" : value === "中" ? "blue" : "gray"}`}>{tPriority(value, locale)}</span>;
}

export default App;
