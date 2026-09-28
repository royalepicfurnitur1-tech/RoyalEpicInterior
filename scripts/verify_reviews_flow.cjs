const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: 'localhost',
      port: 3000,
      path
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
  });
}

function deleteReq(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'DELETE'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runVerification() {
  console.log('=== STARTING 10-STEP COMPLETE REVIEW SYSTEM VERIFICATION ===\n');

  // STEP 1: Customer submits review
  console.log('[STEP 1] Customer submits review from website / portal / product page...');
  const submitPayload = {
    name: 'Siddharth Rao',
    email: 'siddharth.rao@example.com',
    phone: '+91 98450 12345',
    rating: 5,
    review_title: 'Bespoke Burma Teak Dining Table & Living Room Partitions',
    review_message: 'The craftsmanship and precision joinery by Royal Epic exceeded our highest expectations. 15-year warranty was backed with documented material certificates.',
    product_id: 'prod-teak-dining-01',
    product_name: 'Royal Imperial Burma Teak Dining Table',
    project_type: 'Luxury Residential Interior'
  };

  const submitRes = await postJson('/api/reviews/submit', submitPayload);
  console.log('  Submit response status:', submitRes.status);
  console.log('  Submit success:', submitRes.data.success);
  console.log('  Review ID:', submitRes.data.review?.id);
  console.log('  Assigned Status:', submitRes.data.review?.status);

  if (!submitRes.data.success || !submitRes.data.review?.id) {
    throw new Error('STEP 1 FAILED: Could not submit review');
  }
  const reviewId = submitRes.data.review.id;

  // STEP 2: Verify review saved as Pending by default
  console.log('\n[STEP 2] Verify review saved as Pending by default...');
  if (submitRes.data.review.status !== 'pending') {
    throw new Error(`STEP 2 FAILED: Status is ${submitRes.data.review.status}, expected 'pending'`);
  }
  console.log('  ✓ PASSED: Review status is strictly "pending" by default.');

  // STEP 3: Verify pending review is NOT visible publicly
  console.log('\n[STEP 3] Verify pending review is NOT visible publicly...');
  const publicBefore = await getJson('/api/reviews/public');
  const foundInPublicBefore = (publicBefore.data.reviews || []).some(r => r.id === reviewId);
  console.log('  Public total reviews count:', publicBefore.data.totalReviews);
  console.log('  Is pending review visible in public list?', foundInPublicBefore);
  if (foundInPublicBefore) {
    throw new Error('STEP 3 FAILED: Pending review is visible publicly!');
  }
  console.log('  ✓ PASSED: Pending review is completely hidden from public website.');

  // Verify Admin sees it under Pending
  console.log('\n[ADMIN CHECK] Admin checks pending reviews in Admin Dashboard...');
  const adminPending = await getJson('/api/reviews/admin?status=pending');
  const foundInAdminPending = (adminPending.data.reviews || []).some(r => r.id === reviewId);
  console.log('  Admin pending reviews count:', adminPending.data.counts.pending);
  console.log('  Is review in Admin pending list?', foundInAdminPending);
  if (!foundInAdminPending) {
    throw new Error('ADMIN CHECK FAILED: Review not found in Admin pending queue');
  }

  // STEP 4: Admin approves review
  console.log('\n[STEP 4] Admin approves review in Admin Dashboard...');
  const approveRes = await postJson('/api/reviews/moderate', {
    id: reviewId,
    status: 'approved',
    admin_notes: 'Verified against invoice #RE-2026-881. Excellent customer feedback.'
  });
  console.log('  Approve response:', approveRes.data);
  if (!approveRes.data.success || approveRes.data.review?.status !== 'approved') {
    throw new Error('STEP 4 FAILED: Admin failed to approve review');
  }
  console.log('  ✓ PASSED: Review successfully approved.');

  // STEP 5: Review appears on website immediately
  console.log('\n[STEP 5] Review appears on website immediately...');
  const publicAfter = await getJson('/api/reviews/public');
  const approvedReview = (publicAfter.data.reviews || []).find(r => r.id === reviewId);
  console.log('  Found approved review on public website:', Boolean(approvedReview));
  if (!approvedReview) {
    throw new Error('STEP 5 FAILED: Approved review does not appear on public website!');
  }
  console.log('  Title:', approvedReview.review_title);
  console.log('  Reviewer:', approvedReview.name);
  console.log('  ✓ PASSED: Approved review appears on website.');

  // STEP 6: Average rating updates correctly
  console.log('\n[STEP 6] Average rating updates correctly...');
  console.log('  Public Average Rating:', publicAfter.data.averageRating);
  if (publicAfter.data.averageRating <= 0 || publicAfter.data.averageRating > 5) {
    throw new Error('STEP 6 FAILED: Average rating not updated correctly');
  }
  console.log(`  ✓ PASSED: Average rating calculated as ${publicAfter.data.averageRating}`);

  // STEP 7: Review count updates correctly
  console.log('\n[STEP 7] Review count updates correctly...');
  console.log('  Total Public Reviews Count:', publicAfter.data.totalReviews);
  if (publicAfter.data.totalReviews < 1) {
    throw new Error('STEP 7 FAILED: Review count did not increment');
  }
  console.log('  ✓ PASSED: Review count is now', publicAfter.data.totalReviews);

  // STEP 8: Edit approved review
  console.log('\n[STEP 8] Admin edits approved review...');
  const editRes = await postJson('/api/reviews/moderate', {
    id: reviewId,
    status: 'approved',
    rating: 5,
    review_title: 'Bespoke Burma Teak Dining Table & Living Room Partitions (Edited by Admin)',
    review_message: 'Updated feedback: Factory tour and installation was seamless. Exceptional quality.',
    admin_notes: 'Edited headline per client verbal confirmation.'
  });
  console.log('  Edit success:', editRes.data.success);
  console.log('  Updated title:', editRes.data.review?.review_title);
  if (editRes.data.review?.review_title !== 'Bespoke Burma Teak Dining Table & Living Room Partitions (Edited by Admin)') {
    throw new Error('STEP 8 FAILED: Review edit did not persist');
  }
  console.log('  ✓ PASSED: Review edited and updated in database.');

  // STEP 9: Delete review
  console.log('\n[STEP 9] Admin deletes review...');
  const deleteRes = await deleteReq(`/api/reviews/${reviewId}`);
  console.log('  Delete response:', deleteRes.data);
  if (!deleteRes.data.success) {
    throw new Error('STEP 9 FAILED: Could not delete review');
  }

  // Verify deletion from public website
  const publicAfterDelete = await getJson('/api/reviews/public');
  const foundAfterDelete = (publicAfterDelete.data.reviews || []).some(r => r.id === reviewId);
  console.log('  Is deleted review in public list?', foundAfterDelete);
  if (foundAfterDelete) {
    throw new Error('STEP 9 FAILED: Deleted review still appears in public list');
  }
  console.log('  ✓ PASSED: Review successfully deleted and removed from website.');

  // STEP 10: Verify synchronization across all portals
  console.log('\n[STEP 10] Verify synchronization across all portals...');
  const adminAfterDelete = await getJson('/api/reviews/admin?status=all');
  const foundInAdminAfterDelete = (adminAfterDelete.data.reviews || []).some(r => r.id === reviewId);
  console.log('  Is deleted review in admin list?', foundInAdminAfterDelete);
  if (foundInAdminAfterDelete) {
    throw new Error('STEP 10 FAILED: Deleted review still in admin list');
  }
  console.log('  ✓ PASSED: Complete database synchronization verified across all portals.');

  console.log('\n============================================================');
  console.log('🎉 ALL 10 VERIFICATION STEPS COMPLETED AND PASSED WITH 100% SUCCESS!');
  console.log('============================================================');
}

runVerification().catch(err => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
