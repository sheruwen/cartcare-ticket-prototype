export type CaseStatus =
  | "新建立"
  | "待受理"
  | "處理中"
  | "待顧客回覆"
  | "待二線客服處理"
  | "待技術支援"
  | "技術排查中"
  | "已解決"
  | "已結案"
  | "已取消";

export type CaseType =
  | "帳號問題"
  | "訂單問題"
  | "退款問題"
  | "CartPoints 點數問題"
  | "系統問題"
  | "其他";

export type Priority = "低" | "中" | "高" | "緊急";
export type AgentRole = "一線客服" | "二線客服";

export type CartPointsSubtype =
  | "點數餘額異常"
  | "點數未入帳"
  | "點數轉讓延遲"
  | "點數轉讓失敗"
  | "點數交易紀錄異常"
  | "點數遭未授權使用";

export type TransactionStatus = "處理中" | "已完成" | "失敗" | "逾時" | "需人工確認";
export type TechTicketStatus = "待指派" | "待處理" | "處理中" | "待驗證" | "已完成" | "已取消";

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
}

export interface SupportCase {
  id: string;
  title: string;
  customerName: string;
  email: string;
  userId: string;
  type: CaseType;
  subtype: string;
  status: CaseStatus;
  priority: Priority;
  assignee: string;
  isCartPoints: boolean;
  hasTechTicket: boolean;
  createdAt: string;
  updatedAt: string;
  slaDueAt: string;
  overdue: boolean;
  satisfaction?: number;
  historyCaseIds: string[];
  relatedTransactionIds: string[];
  relatedTechTicketIds: string[];
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  time: string;
  actor: string;
  type: string;
  description: string;
}

export interface CartPointsTransaction {
  id: string;
  userId: string;
  email: string;
  memberName: string;
  memberTier: string;
  balance: number;
  occurredAt: string;
  updatedAt: string;
  transactionType: string;
  pointsDelta: number;
  targetMember: string;
  status: TransactionStatus;
  chainStatus: string;
  summary: string;
  recommendation: string;
}

export interface TechTicket {
  id: string;
  title: string;
  description: string;
  status: TechTicketStatus;
  priority: Priority;
  assignee: string;
  updatedAt: string;
  linkedCaseIds: string[];
  linkedTransactionIds: string[];
}
