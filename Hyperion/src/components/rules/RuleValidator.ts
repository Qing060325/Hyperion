// ==========================================
// RuleValidator - Rule Validation Utilities
// ==========================================

import type { RuleFormData, RuleValidationResult } from "../../types/rule-editor";
import { RULE_TYPES } from "../../types/rule-editor";

/**
 * Validate a single rule
 */
export function validateRule(rule: RuleFormData): RuleValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check type
  if (!rule.type) {
    errors.push('规则类型不能为空');
  } else if (!RULE_TYPES.find(r => r.type === rule.type)) {
    errors.push(`未知的规则类型: ${rule.type}`);
  }

  // Check payload
  if (!rule.payload || rule.payload.trim() === '') {
    errors.push('匹配内容不能为空');
  } else {
    // Type-specific validation
    switch (rule.type) {
      case 'DOMAIN':
      case 'DOMAIN-SUFFIX':
      case 'DOMAIN-KEYWORD':
        if (rule.payload.includes('/')) {
          warnings.push('域名规则通常不包含斜杠');
        }
        break;
      
      case 'IP-CIDR':
        if (!isValidIPv4CIDR(rule.payload)) {
          errors.push('无效的 IPv4 CIDR 格式');
        }
        break;
      
      case 'IP-CIDR6':
        if (!isValidIPv6CIDR(rule.payload)) {
          errors.push('无效的 IPv6 CIDR 格式');
        }
        break;
      
      case 'DST-PORT':
      case 'SRC-PORT':
        if (!isValidPort(rule.payload)) {
          errors.push('端口号必须在 1-65535 之间');
        }
        break;
      
      case 'DOMAIN-REGEX':
        try {
          new RegExp(rule.payload);
        } catch {
          errors.push('无效的正则表达式');
        }
        break;
    }
  }

  // Check proxy
  if (!rule.proxy || rule.proxy.trim() === '') {
    errors.push('目标策略不能为空');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple rules
 */
export function validateRules(rules: RuleFormData[]): Map<number, RuleValidationResult> {
  const results = new Map<number, RuleValidationResult>();
  
  rules.forEach((rule, index) => {
    results.set(index, validateRule(rule));
  });
  
  return results;
}

/**
 * Check if string is valid IPv4 CIDR
 */
function isValidIPv4CIDR(cidr: string): boolean {
  const pattern = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!pattern.test(cidr)) return false;
  
  const [ip, prefix] = cidr.split('/');
  const parts = ip.split('.').map(Number);
  const prefixNum = parseInt(prefix, 10);
  
  return (
    parts.every(p => p >= 0 && p <= 255) &&
    prefixNum >= 0 && prefixNum <= 32
  );
}

/**
 * Check if string is valid IPv6 CIDR
 */
function isValidIPv6CIDR(cidr: string): boolean {
  // Simplified IPv6 CIDR validation
  const pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\/\d{1,3}$/;
  return pattern.test(cidr);
}

/**
 * Check if string is valid port number or range
 */
function isValidPort(port: string): boolean {
  // Single port
  if (/^\d+$/.test(port)) {
    const num = parseInt(port, 10);
    return num >= 1 && num <= 65535;
  }
  
  // Port range (e.g., 1000-2000)
  if (/^\d+-\d+$/.test(port)) {
    const [start, end] = port.split('-').map(Number);
    return start >= 1 && start <= 65535 && end >= 1 && end <= 65535 && start <= end;
  }
  
  return false;
}

/**
 * Parse rule from string
 */
export function parseRuleString(line: string): RuleFormData | null {
  try {
    const parts = line.trim().split(',');
    if (parts.length < 3) return null;
    
    const [type, payload, proxy, ...rest] = parts;
    
    return {
      id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as any,
      payload,
      proxy,
      noResolve: rest.includes('no-resolve'),
      enabled: true,
    };
  } catch {
    return null;
  }
}

/**
 * Parse multiple rules from string
 */
export function parseRulesString(content: string): RuleFormData[] {
  const lines = content.split('\n');
  const rules: RuleFormData[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const rule = parseRuleString(trimmed);
    if (rule) {
      rules.push(rule);
    }
  }
  
  return rules;
}
