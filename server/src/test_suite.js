// Comprehensive Multi-User Automated Acceptance Test Suite for SecureBank
const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('  SECUREBANK COMPREHENSIVE MULTI-USER ACCEPTANCE TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Register User A & Complete First-Time Onboarding
    // -------------------------------------------------------------
    console.log('1. Testing User A ("Akash Kumar" / @akashk) Registration...');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Akash',
        lastName: 'Kumar',
        dob: '1996-08-20',
        mobile: '9811223344',
        email: `akash.${Date.now()}@example.com`,
        address: 'B-201, Shanti Niketan',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        username: `akashk_${Date.now()}`,
        password: 'Password@123',
        securityQuestion: 'What is your mother maiden name?',
        securityAnswer: 'Devi'
      })
    });
    const dataA = await regResA.json();
    assert(dataA.success === true, 'User A registered successfully');
    assert(dataA.user.customerId.startsWith('SBK'), `Generated Customer ID: ${dataA.user?.customerId}`);
    assert(dataA.user.account.accountNumber.length === 12, `Generated 12-digit Account Number: ${dataA.user?.account.accountNumber}`);
    assert(dataA.user.account.balance === 0, 'Initial Account Balance is ₹0.00');

    const tokenA = dataA.token;
    const userAId = dataA.user.id;
    const userAUsername = dataA.user.username;
    const userAAccId = dataA.user.account.id;

    // First time onboarding setup for User A (Set Transaction PIN + Virtual Card)
    console.log('\n2. Testing User A First-Time Onboarding Setup (PIN & Debit Card)...');
    const onboardResA = await fetch(`${BASE_URL}/auth/onboarding/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        transactionPin: '4512',
        cardPin: '8291'
      })
    });
    const onboardDataA = await onboardResA.json();
    assert(onboardDataA.success === true, 'User A Onboarding completed with Transaction PIN and Virtual Card');
    const updatedTokenA = onboardDataA.token;

    // -------------------------------------------------------------
    // TEST 2: Register User B & Complete Onboarding
    // -------------------------------------------------------------
    console.log('\n3. Testing User B ("Rahul Sharma" / @rahuls) Registration...');
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Rahul',
        lastName: 'Sharma',
        dob: '1995-12-10',
        mobile: '9899887766',
        email: `rahul.${Date.now()}@example.com`,
        address: 'House 44, Indiranagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560038',
        username: `rahuls_${Date.now()}`,
        password: 'SecurePass@2026',
        securityQuestion: 'What was your first pet name?',
        securityAnswer: 'Bruno'
      })
    });
    const dataB = await regResB.json();
    assert(dataB.success === true, 'User B registered successfully');
    assert(dataB.user.customerId !== dataA.user.customerId, `User B has distinct Customer ID: ${dataB.user?.customerId}`);
    const tokenB = dataB.token;
    const userBId = dataB.user.id;
    const userBUsername = dataB.user.username;
    const userBAccId = dataB.user.account.id;

    // User B Onboarding
    const onboardResB = await fetch(`${BASE_URL}/auth/onboarding/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
      body: JSON.stringify({ transactionPin: '9988', cardPin: '1234' })
    });
    const onboardDataB = await onboardResB.json();
    assert(onboardDataB.success === true, 'User B Onboarding completed');
    const updatedTokenB = onboardDataB.token;

    // -------------------------------------------------------------
    // TEST 3: User A searches for User B via Pay & Request
    // -------------------------------------------------------------
    console.log('\n4. Testing Privacy-Safe User Search...');
    const searchRes = await fetch(`${BASE_URL}/pay-request/search-users?q=${userBUsername.slice(0, 6)}`, {
      headers: { 'Authorization': `Bearer ${updatedTokenA}` }
    });
    const searchData = await searchRes.json();
    assert(searchData.success === true, 'User search returned results');
    const foundB = searchData.users?.find(u => u.id === userBId);
    assert(foundB !== undefined, `Found User B in directory: ${foundB?.displayName} (@${foundB?.username})`);
    assert(foundB?.accountNumber === undefined, 'Privacy Guard: Account number is NEVER exposed in search');
    assert(foundB?.email === undefined, 'Privacy Guard: Email is NEVER exposed in search');

    // -------------------------------------------------------------
    // TEST 4: Deposit Simulated Test Funds to User A
    // -------------------------------------------------------------
    console.log('\n5. Depositing Simulated Funds to User A (₹15,000)...');
    const depRes = await fetch(`${BASE_URL}/accounts/deposit-funds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        accountId: userAAccId,
        amount: 15000,
        description: 'Simulated Salary Credit'
      })
    });
    const depData = await depRes.json();
    assert(depData.success === true, 'Simulated deposit of ₹15,000 credited to User A');

    // -------------------------------------------------------------
    // TEST 5: User A sends ₹1,000 to User B
    // -------------------------------------------------------------
    console.log('\n6. Testing Atomic Peer Transfer: User A sends ₹1,000 to User B...');
    const sendRes = await fetch(`${BASE_URL}/pay-request/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        sourceAccountId: userAAccId,
        recipientUserId: userBId,
        amount: 1000,
        transactionPin: '4512',
        message: 'Project contribution'
      })
    });
    const sendData = await sendRes.json();
    assert(sendData.success === true, `Transfer successful! Txn ID: ${sendData.receipt?.transactionId}`);
    assert(sendData.receipt?.balanceAfter === 14000, 'User A balance decreased atomically to ₹14,000');

    // Verify User B's balance
    const meResB = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${updatedTokenB}` }
    });
    const meDataB = await meResB.json();
    if (!meDataB.user) {
      console.error('meDataB failure:', meResB.status, meDataB);
    }
    assert(meDataB.user?.accounts[0].balance === 1000, 'User B balance increased atomically to ₹1,000');

    // -------------------------------------------------------------
    // TEST 6: User B creates a Money Request for ₹500 from User A
    // -------------------------------------------------------------
    console.log('\n7. Testing Money Request: User B requests ₹500 from User A...');
    const reqRes = await fetch(`${BASE_URL}/pay-request/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenB}` },
      body: JSON.stringify({
        payerUserId: userAId,
        amount: 500,
        reason: 'Lunch share'
      })
    });
    const reqData = await reqRes.json();
    assert(reqData.success === true, `Payment request created with ID: ${reqData.requestId}`);

    // User A fetches pending requests
    const listReqsRes = await fetch(`${BASE_URL}/pay-request/requests`, {
      headers: { 'Authorization': `Bearer ${updatedTokenA}` }
    });
    const listReqsData = await listReqsRes.json();
    const inboundReq = listReqsData.incoming?.find(r => r.requesterId === userBId);
    assert(inboundReq !== undefined && inboundReq.status === 'PENDING', 'User A sees pending request from User B');

    // -------------------------------------------------------------
    // TEST 7: User A pays the ₹500 Money Request
    // -------------------------------------------------------------
    console.log('\n8. Testing Payment Request Fulfillment (User A pays ₹500)...');
    const payReqRes = await fetch(`${BASE_URL}/pay-request/requests/${inboundReq.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        sourceAccountId: userAAccId,
        transactionPin: '4512'
      })
    });
    const payReqData = await payReqRes.json();
    assert(payReqData.success === true, 'Payment request authorized & paid successfully');

    // Check balances
    const meResA2 = await fetch(`${BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${updatedTokenA}` } });
    const meResB2 = await fetch(`${BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${updatedTokenB}` } });
    const balA = (await meResA2.json()).user.accounts[0].balance;
    const balB = (await meResB2.json()).user.accounts[0].balance;
    assert(balA === 13500, `User A updated balance: ₹${balA} (expected ₹13,500)`);
    assert(balB === 1500, `User B updated balance: ₹${balB} (expected ₹1,500)`);

    // -------------------------------------------------------------
    // TEST 8: Unauthorized Access Prevention
    // -------------------------------------------------------------
    console.log('\n9. Testing Security Authorization Check (User A attempting to access User B account)...');
    const unauthRes = await fetch(`${BASE_URL}/accounts/${userBAccId}`, {
      headers: { 'Authorization': `Bearer ${updatedTokenA}` }
    });
    assert(unauthRes.status === 404 || unauthRes.status === 403, `Access rejected with HTTP ${unauthRes.status}`);

    // -------------------------------------------------------------
    // TEST 9: Overdraft / Insufficient Balance Prevention
    // -------------------------------------------------------------
    console.log('\n10. Testing Insufficient Balance Transfer Rejection...');
    const overRes = await fetch(`${BASE_URL}/pay-request/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        sourceAccountId: userAAccId,
        recipientUserId: userBId,
        amount: 50000, // greater than balance
        transactionPin: '4512'
      })
    });
    const overData = await overRes.json();
    assert(overRes.status === 400 && overData.success === false, `Overdraft rejected: "${overData.message}"`);

    // -------------------------------------------------------------
    // TEST 10: Fixed Deposit Creation
    // -------------------------------------------------------------
    console.log('\n11. Testing Fixed Deposit Opening (₹5,000 for 12 Months)...');
    const fdRes = await fetch(`${BASE_URL}/deposits/open-fd`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        sourceAccountId: userAAccId,
        principalAmount: 5000,
        tenureMonths: 12,
        transactionPin: '4512'
      })
    });
    const fdData = await fdRes.json();
    assert(fdData.success === true, `FD opened: Deposit No. ${fdData.result?.depositNo}, Maturity: ₹${fdData.result?.maturityAmount}`);

    // -------------------------------------------------------------
    // TEST 11: Bill Payment Simulation
    // -------------------------------------------------------------
    console.log('\n12. Testing Utility Bill Payment...');
    const billRes = await fetch(`${BASE_URL}/bills/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${updatedTokenA}` },
      body: JSON.stringify({
        accountId: userAAccId,
        billerId: 'bil-elec-1',
        consumerNumber: '9000123456',
        amount: 850,
        transactionPin: '4512'
      })
    });
    const billData = await billRes.json();
    assert(billData.success === true, `Bill paid: Txn ${billData.receipt?.transactionId}`);

    // -------------------------------------------------------------
    // TEST 12: Login History & Re-login
    // -------------------------------------------------------------
    console.log('\n13. Testing Re-login and Login History Update...');
    // First login records current time, second login retrieves that previous timestamp
    const secondLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: userAUsername,
        password: 'Password@123'
      })
    });
    const secondLoginData = await secondLoginRes.json();
    assert(secondLoginData.success === true, 'Second login successful');
    assert(secondLoginData.user.lastLoginAt !== null, `Previous Login Recorded: ${secondLoginData.user.lastLoginAt}`);

    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');
  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
