#!/bin/bash

# PayMongo Webhook Testing Script
# Usage: ./test-webhook.sh [ngrok-url]

set -e

NGROK_URL=${1:-"http://localhost:3000"}
WEBHOOK_ENDPOINT="$NGROK_URL/api/webhooks/paymongo"

echo "=================================="
echo "PayMongo Webhook Testing Script"
echo "=================================="
echo ""
echo "Target: $WEBHOOK_ENDPOINT"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check (GET)
echo "Test 1: Health Check Endpoint"
echo "------------------------------"
echo "Testing: GET $WEBHOOK_ENDPOINT"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$WEBHOOK_ENDPOINT")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HEALTH_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Health check passed (HTTP $HEALTH_CODE)${NC}"
  echo "Response: $HEALTH_BODY"
else
  echo -e "${RED}❌ Health check failed (HTTP $HEALTH_CODE)${NC}"
  echo "Response: $HEALTH_BODY"
fi

echo ""
echo ""

# Test 2: POST with Test Payload
echo "Test 2: POST Test Webhook Payload"
echo "----------------------------------"
echo "Testing: POST $WEBHOOK_ENDPOINT"
echo "Payload: test-webhook.json"
echo ""

if [ ! -f "test-webhook.json" ]; then
  echo -e "${RED}❌ test-webhook.json not found${NC}"
  echo "Please ensure test-webhook.json exists in the current directory"
  exit 1
fi

WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$WEBHOOK_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d @test-webhook.json)

WEBHOOK_CODE=$(echo "$WEBHOOK_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
WEBHOOK_BODY=$(echo "$WEBHOOK_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$WEBHOOK_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Webhook POST succeeded (HTTP $WEBHOOK_CODE)${NC}"
  echo "Response: $WEBHOOK_BODY"
else
  echo -e "${RED}❌ Webhook POST failed (HTTP $WEBHOOK_CODE)${NC}"
  echo "Response: $WEBHOOK_BODY"
fi

echo ""
echo ""

# Test 3: OPTIONS (CORS Preflight)
echo "Test 3: OPTIONS Preflight Request"
echo "----------------------------------"
echo "Testing: OPTIONS $WEBHOOK_ENDPOINT"
echo ""

OPTIONS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X OPTIONS "$WEBHOOK_ENDPOINT" \
  -H "Origin: https://api.paymongo.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, paymongo-signature")

OPTIONS_CODE=$(echo "$OPTIONS_RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)

if [ "$OPTIONS_CODE" == "204" ]; then
  echo -e "${GREEN}✅ CORS preflight succeeded (HTTP $OPTIONS_CODE)${NC}"
else
  echo -e "${RED}❌ CORS preflight failed (HTTP $OPTIONS_CODE)${NC}"
fi

echo ""
echo ""

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo ""

if [ "$HEALTH_CODE" == "200" ] && [ "$WEBHOOK_CODE" == "200" ] && [ "$OPTIONS_CODE" == "204" ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Your webhook endpoint is properly configured and reachable."
  echo ""
  echo "Next steps:"
  echo "1. Verify this URL is registered in PayMongo dashboard"
  echo "2. Ensure webhook events include: source.chargeable, payment.paid, payment.failed"
  echo "3. Create a test booking and authorize payment"
  echo "4. Monitor dev server terminal for webhook logs"
else
  echo -e "${YELLOW}⚠️ Some tests failed${NC}"
  echo ""
  echo "Health Check: $([ "$HEALTH_CODE" == "200" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
  echo "Webhook POST: $([ "$WEBHOOK_CODE" == "200" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
  echo "CORS Preflight: $([ "$OPTIONS_CODE" == "204" ] && echo -e "${GREEN}PASS${NC}" || echo -e "${RED}FAIL${NC}")"
  echo ""
  echo "Check WEBHOOK_TEST_INSTRUCTIONS.md for troubleshooting steps"
fi

echo ""
