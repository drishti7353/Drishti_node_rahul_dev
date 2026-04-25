function calculateDistance(lat1, lon1, lat2, lon2) {
  console.log('Inputs:', lat1, lon1, lat2, lon2);
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  console.log('Distance result:', d, typeof d, !isNaN(d));
  console.log('Condition check:', typeof d === 'number' && !isNaN(d));
  console.log('Final formatted:', (typeof d === 'number' && !isNaN(d)) ? `${d.toFixed(1)} km` : 'Unknown');
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

console.log('Testing same coordinates:');
calculateDistance(28.3906617, 79.422375, 28.3906617, 79.422375);

console.log('\nTesting different coordinates:');
calculateDistance(28.3906617, 79.422375, 19.1925889, 72.9441371);
