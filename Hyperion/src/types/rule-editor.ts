// ==========================================
// Rule Editor Type Definitions
// ==========================================

/** All supported rule types in Clash Meta */
export type RuleType =
  | 'DOMAIN'
  | 'DOMAIN-SUFFIX'
  | 'DOMAIN-KEYWORD'
  | 'DOMAIN-REGEX'
  | 'IP-CIDR'
  | 'IP-CIDR6'
  | 'IP-SUFFIX'
  | 'GEOIP'
  | 'GEOSITE'
  | 'SRC-GEOIP'
  | 'SRC-IP-CIDR'
  | 'SRC-IP-SUFFIX'
  | 'PROCESS-NAME'
  | 'PROCESS-PATH'
  | 'PROCESS-NAME-KEYWORD'
  | 'PROCESS-NAME-REGEX'
  | 'RULE-SET'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NETWORK'
  | 'UID'
  | 'IN-TYPE'
  | 'IN-USER'
  | 'IN-NAME'
  | 'DST-PORT'
  | 'SRC-PORT'
  | 'FINAL'
  | 'MATCH';

/** Rule form data for editing */
export interface RuleFormData {
  id?: string;
  type: RuleType;
  payload: string;
  proxy: string;
  noResolve?: boolean;
  enabled?: boolean;
}

/** Rule validation result */
export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Rule edit state */
export interface RuleEditState {
  rules: RuleFormData[];
  originalRules: RuleFormData[];
  modified: boolean;
  selectedRuleIndex: number | null;
  searchQuery: string;
  filterType: RuleType | 'all';
}

/** Rule type category */
export type RuleTypeCategory = 'domain' | 'ip' | 'geo' | 'process' | 'port' | 'logical' | 'other';

/** Rule type metadata */
export interface RuleTypeMeta {
  type: RuleType;
  name: string;
  category: RuleTypeCategory;
  description: string;
  example: string;
  icon: string;
}

/** All rule types metadata */
export const RULE_TYPES: RuleTypeMeta[] = [
  // Domain rules
  { type: 'DOMAIN', name: '域名', category: 'domain', description: '匹配完整域名', example: 'DOMAIN,google.com,Proxy', icon: '🌐' },
  { type: 'DOMAIN-SUFFIX', name: '域名后缀', category: 'domain', description: '匹配域名后缀', example: 'DOMAIN-SUFFIX,google.com,Proxy', icon: '🌐' },
  { type: 'DOMAIN-KEYWORD', name: '域名关键词', category: 'domain', description: '匹配域名关键词', example: 'DOMAIN-KEYWORD,google,Proxy', icon: '🔍' },
  { type: 'DOMAIN-REGEX', name: '域名正则', category: 'domain', description: '使用正则匹配域名', example: 'DOMAIN-REGEX,^.*google.*$,Proxy', icon: '📝' },
  
  // IP rules
  { type: 'IP-CIDR', name: 'IP CIDR', category: 'ip', description: '匹配 IPv4 CIDR', example: 'IP-CIDR,192.168.1.0/24,Direct', icon: '🔢' },
  { type: 'IP-CIDR6', name: 'IPv6 CIDR', category: 'ip', description: '匹配 IPv6 CIDR', example: 'IP-CIDR6,2001:db8::/32,Direct', icon: '🔢' },
  { type: 'IP-SUFFIX', name: 'IP 后缀', category: 'ip', description: '匹配 IP 后缀', example: 'IP-SUFFIX,8.8.8.8,Proxy', icon: '🔢' },
  
  // Geo rules
  { type: 'GEOIP', name: 'GeoIP', category: 'geo', description: '匹配 IP 地理位置', example: 'GEOIP,CN,Direct', icon: '🌍' },
  { type: 'GEOSITE', name: 'GeoSite', category: 'geo', description: '匹配网站地理位置', example: 'GEOSITE,google,Proxy', icon: '🌍' },
  { type: 'SRC-GEOIP', name: '源 GeoIP', category: 'geo', description: '匹配源 IP 地理位置', example: 'SRC-GEOIP,CN,Direct', icon: '🌍' },
  
  // Process rules
  { type: 'PROCESS-NAME', name: '进程名', category: 'process', description: '匹配进程名', example: 'PROCESS-NAME,chrome.exe,Proxy', icon: '⚙️' },
  { type: 'PROCESS-PATH', name: '进程路径', category: 'process', description: '匹配进程完整路径', example: 'PROCESS-PATH,/usr/bin/curl,Proxy', icon: '📁' },
  
  // Port rules
  { type: 'DST-PORT', name: '目标端口', category: 'port', description: '匹配目标端口', example: 'DST-PORT,80,Direct', icon: '🔌' },
  { type: 'SRC-PORT', name: '源端口', category: 'port', description: '匹配源端口', example: 'SRC-PORT,8080,Direct', icon: '🔌' },
  
  // Logical rules
  { type: 'AND', name: 'AND 逻辑', category: 'logical', description: '多个条件同时匹配', example: 'AND,((DOMAIN,google.com),(DST-PORT,443)),Proxy', icon: '🔗' },
  { type: 'OR', name: 'OR 逻辑', category: 'logical', description: '任一条件匹配', example: 'OR,((DOMAIN,google.com),(DOMAIN,youtube.com)),Proxy', icon: '🔗' },
  { type: 'NOT', name: 'NOT 逻辑', category: 'logical', description: '条件取反', example: 'NOT,((GEOIP,CN)),Proxy', icon: '🚫' },
  
  // Rule set
  { type: 'RULE-SET', name: '规则集', category: 'other', description: '引用规则集', example: 'RULE-SET,cn-domain,Direct', icon: '📦' },
  
  // Final
  { type: 'FINAL', name: '最终规则', category: 'other', description: '最终匹配规则', example: 'FINAL,Proxy', icon: '🏁' },
  { type: 'MATCH', name: '匹配所有', category: 'other', description: '匹配所有请求', example: 'MATCH,Proxy', icon: '✅' },
];

/** Get rule types by category */
export function getRuleTypesByCategory(category: RuleTypeCategory): RuleTypeMeta[] {
  return RULE_TYPES.filter(r => r.category === category);
}

/** Get rule type meta */
export function getRuleTypeMeta(type: RuleType): RuleTypeMeta | undefined {
  return RULE_TYPES.find(r => r.type === type);
}
