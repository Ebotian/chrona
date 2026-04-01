#!/bin/bash

# 清洗输入
DOMAIN=$1
DOMAIN=$(echo "$DOMAIN" | sed -E 's|^https?://||' | sed -E 's|/.*||')

if [ -z "$DOMAIN" ]; then
    echo "用法：$0 <域名或URL>"
    exit 1
fi

# 代理环境专用 curl 参数
CURL="curl -s -L --max-time 15 --connect-timeout 10"

echo "=== HTTPS 检查: ${DOMAIN} (代理模式) ==="
echo

# 1. HTTP → HTTPS 跳转检查
echo "1. HTTP 重定向检查:"
HTTP_RESP=$($CURL -I "http://${DOMAIN}" 2>&1)
HTTP_CODE=$(echo "$HTTP_RESP" | grep -i "^HTTP/" | tail -1 | awk '{print $2}')
LOCATION=$(echo "$HTTP_RESP" | grep -i "^location:" | tail -1 | tr -d '\r')

if echo "$LOCATION" | grep -qi "https://"; then
    echo "   ✓ 已跳转到 HTTPS (状态: ${HTTP_CODE:-未知})"
    echo "   → $LOCATION"
elif [[ "$HTTP_CODE" == "200" ]]; then
    echo "   ⚠ HTTP 直接返回 200（可能是代理或边缘节点行为）"
    echo "   建议手动确认：curl -I http://${DOMAIN}"
else
    echo "   ? 状态码: ${HTTP_CODE:-无响应}"
    echo "$HTTP_RESP" | head -3
fi
echo

# 2. HTTPS 可用性
echo "2. HTTPS 连接检查:"
HTTPS_CODE=$($CURL -o /dev/null -w "%{http_code}" "https://${DOMAIN}")
if [[ "$HTTPS_CODE" =~ ^(200|301|302|404)$ ]]; then
    echo "   ✓ HTTPS 可访问 (状态: ${HTTPS_CODE})"
else
    echo "   ✗ HTTPS 连接失败 (状态: ${HTTPS_CODE:-000})"
fi
echo

# 3. SSL 证书（直连，不受 HTTP 代理影响）
echo "3. SSL 证书检查:"
CERT_INFO=$(echo | timeout 10 openssl s_client -connect "${DOMAIN}:443" -servername "${DOMAIN}" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null)
if [ -n "$CERT_INFO" ]; then
    echo "   ✓ 证书信息:"
    echo "$CERT_INFO" | sed 's/^/   /'
else
    echo "   ✗ 无法获取证书（可能是代理阻断或域名解析问题）"
fi
echo

# 4. HSTS 头
echo "4. HSTS 检查:"
HSTS=$($CURL -I "https://${DOMAIN}" 2>&1 | grep -i "^strict-transport-security:")
if [ -n "$HSTS" ]; then
    echo "   ✓ HSTS 已启用"
    echo "   $HSTS" | sed 's/^/   /'
else
    echo "   ⚠ 未检测到 HSTS（非必须，但建议启用）"
fi