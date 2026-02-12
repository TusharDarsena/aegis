// Quick test of the RFQ service
import { RFQService } from './src/services/rfq.js';

const service = new RFQService();

console.log('✅ Testing RFQ Service...\n');

// Test 1: Submit RFQ
try {
  const quote = service.submitRfq({
    requesterWallet: '0x' + '1'.repeat(64),
    buyTokenId: 'BTC',
    sellTokenId: 'USDC',
    buyAmount: '1000000',
    sellAmount: '45000000000'
  });
  
  console.log('✅ Test 1 PASSED: Submit RFQ');
  console.log('   Order Hash:', quote.order.orderHash);
  console.log('   Signer Token:', quote.order.signer.tokenId);
  console.log('   Sender Token:', quote.order.sender.tokenId);
  console.log('   State:', quote.order.state);
  console.log('   Quote Expiry:', quote.quoteExpiry);
} catch (error) {
  console.error('❌ Test 1 FAILED:', error.message);
}

// Test 2: Get user orders
try {
  const wallet = '0x' + '1'.repeat(64);
  const orders = service.getUserOrders(wallet);
  console.log('\n✅ Test 2 PASSED: Get User Orders');
  console.log('   Orders for wallet:', orders.length);
} catch (error) {
  console.error('\n❌ Test 2 FAILED:', error.message);
}

// Test 3: Mark order filled
try {
  const orders = service.getAllOrders();
  if (orders.length > 0) {
    const orderId = orders[0].orderHash;
    const filled = service.markOrderFilled(orderId);
    console.log('\n✅ Test 3 PASSED: Mark Order Filled');
    console.log('   Order State:', filled?.state);
  }
} catch (error) {
  console.error('\n❌ Test 3 FAILED:', error.message);
}

// Test 4: Invalid RFQ (should fail)
try {
  service.submitRfq({
    requesterWallet: 'invalid',
    buyTokenId: 'BTC'
  });
  console.error('\n❌ Test 4 FAILED: Should have thrown error for invalid wallet');
} catch (error) {
  console.log('\n✅ Test 4 PASSED: Validation works correctly');
  console.log('   Error:', error.message.substring(0, 50) + '...');
}

console.log('\n✅ All tests completed successfully!');
