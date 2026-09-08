/**
 * Place lookup for manual location entry.
 *
 * GPS is the better answer when a farmer allows it, but plenty of phones deny
 * the permission or sit under canopy with no fix, so picking a taluk from a
 * list has to work just as well. District centroids are close enough for
 * weather — a forecast does not change meaningfully across a taluk — and the
 * state is what scopes the mandi price query.
 *
 * Karnataka is covered at taluk level because that is the launch region.
 * Other states carry their main agricultural districts; add more as you expand.
 */

export interface Place {
  name: string;
  district: string;
  lat: number;
  lon: number;
}

export const STATES = [
  "Karnataka",
  "Kerala",
  "Tamil Nadu",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Gujarat",
  "Madhya Pradesh",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Rajasthan",
  "Bihar",
  "West Bengal",
  "Odisha",
  "Assam",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Goa",
] as const;

export const PLACES: Record<string, Place[]> = {
  Karnataka: [
    { name: "Mangaluru", district: "Dakshina Kannada", lat: 12.87, lon: 74.88 },
    { name: "Puttur", district: "Dakshina Kannada", lat: 12.7597, lon: 75.2 },
    { name: "Sullia", district: "Dakshina Kannada", lat: 12.56, lon: 75.387 },
    { name: "Bantwal", district: "Dakshina Kannada", lat: 12.89, lon: 75.035 },
    { name: "Belthangady", district: "Dakshina Kannada", lat: 13.0, lon: 75.3 },
    { name: "Udupi", district: "Udupi", lat: 13.3409, lon: 74.7421 },
    { name: "Karkala", district: "Udupi", lat: 13.215, lon: 74.99 },
    { name: "Kundapura", district: "Udupi", lat: 13.625, lon: 74.69 },
    { name: "Sirsi", district: "Uttara Kannada", lat: 14.6195, lon: 74.8354 },
    { name: "Yellapur", district: "Uttara Kannada", lat: 14.964, lon: 74.708 },
    { name: "Kumta", district: "Uttara Kannada", lat: 14.4258, lon: 74.4189 },
    { name: "Siddapur", district: "Uttara Kannada", lat: 14.3436, lon: 74.8946 },
    { name: "Karwar", district: "Uttara Kannada", lat: 14.8136, lon: 74.1297 },
    { name: "Shivamogga", district: "Shivamogga", lat: 13.9299, lon: 75.5681 },
    { name: "Sagar", district: "Shivamogga", lat: 14.1667, lon: 75.0333 },
    { name: "Tirthahalli", district: "Shivamogga", lat: 13.689, lon: 75.247 },
    { name: "Hosanagara", district: "Shivamogga", lat: 13.913, lon: 75.06 },
    { name: "Bhadravati", district: "Shivamogga", lat: 13.8484, lon: 75.7049 },
    { name: "Chikkamagaluru", district: "Chikkamagaluru", lat: 13.3161, lon: 75.772 },
    { name: "Mudigere", district: "Chikkamagaluru", lat: 13.1333, lon: 75.6333 },
    { name: "Madikeri", district: "Kodagu", lat: 12.4244, lon: 75.7382 },
    { name: "Virajpet", district: "Kodagu", lat: 12.1978, lon: 75.8036 },
    { name: "Hassan", district: "Hassan", lat: 13.0072, lon: 76.0962 },
    { name: "Arasikere", district: "Hassan", lat: 13.314, lon: 76.257 },
    { name: "Mysuru", district: "Mysuru", lat: 12.2958, lon: 76.6394 },
    { name: "Mandya", district: "Mandya", lat: 12.5223, lon: 76.8955 },
    { name: "Chamarajanagar", district: "Chamarajanagar", lat: 11.9261, lon: 76.9437 },
    { name: "Bengaluru", district: "Bengaluru Urban", lat: 12.9716, lon: 77.5946 },
    { name: "Doddaballapur", district: "Bengaluru Rural", lat: 13.2257, lon: 77.5383 },
    { name: "Kolar", district: "Kolar", lat: 13.1362, lon: 78.1291 },
    { name: "Chikkaballapur", district: "Chikkaballapur", lat: 13.4355, lon: 77.7315 },
    { name: "Tumakuru", district: "Tumakuru", lat: 13.3379, lon: 77.101 },
    { name: "Davangere", district: "Davanagere", lat: 14.4644, lon: 75.9218 },
    { name: "Channagiri", district: "Davanagere", lat: 14.024, lon: 75.926 },
    { name: "Chitradurga", district: "Chitradurga", lat: 14.2251, lon: 76.398 },
    { name: "Holalkere", district: "Chitradurga", lat: 14.045, lon: 76.185 },
    { name: "Ballari", district: "Ballari", lat: 15.1394, lon: 76.9214 },
    { name: "Koppal", district: "Koppal", lat: 15.3459, lon: 76.1547 },
    { name: "Raichur", district: "Raichur", lat: 16.2076, lon: 77.3463 },
    { name: "Kalaburagi", district: "Kalaburagi", lat: 17.3297, lon: 76.8343 },
    { name: "Bidar", district: "Bidar", lat: 17.9104, lon: 77.5199 },
    { name: "Yadgir", district: "Yadgir", lat: 16.7625, lon: 77.1376 },
    { name: "Vijayapura", district: "Vijayapura", lat: 16.8302, lon: 75.71 },
    { name: "Bagalkote", district: "Bagalkote", lat: 16.1691, lon: 75.6615 },
    { name: "Belagavi", district: "Belagavi", lat: 15.8497, lon: 74.4977 },
    { name: "Hubballi", district: "Dharwad", lat: 15.3647, lon: 75.124 },
    { name: "Gadag", district: "Gadag", lat: 15.4315, lon: 75.6355 },
    { name: "Haveri", district: "Haveri", lat: 14.7951, lon: 75.404 },
    { name: "Ramanagara", district: "Ramanagara", lat: 12.7217, lon: 77.2807 },
  ],
  Kerala: [
    { name: "Kasaragod", district: "Kasaragod", lat: 12.4996, lon: 74.9869 },
    { name: "Kannur", district: "Kannur", lat: 11.8745, lon: 75.3704 },
    { name: "Kozhikode", district: "Kozhikode", lat: 11.2588, lon: 75.7804 },
    { name: "Wayanad", district: "Wayanad", lat: 11.6854, lon: 76.132 },
    { name: "Thrissur", district: "Thrissur", lat: 10.5276, lon: 76.2144 },
    { name: "Idukki", district: "Idukki", lat: 9.8497, lon: 76.9681 },
    { name: "Kottayam", district: "Kottayam", lat: 9.5916, lon: 76.5222 },
  ],
  "Tamil Nadu": [
    { name: "Coimbatore", district: "Coimbatore", lat: 11.0168, lon: 76.9558 },
    { name: "Erode", district: "Erode", lat: 11.341, lon: 77.7172 },
    { name: "Salem", district: "Salem", lat: 11.6643, lon: 78.146 },
    { name: "Thanjavur", district: "Thanjavur", lat: 10.787, lon: 79.1378 },
    { name: "Madurai", district: "Madurai", lat: 9.9252, lon: 78.1198 },
    { name: "Nilgiris", district: "Nilgiris", lat: 11.4064, lon: 76.6932 },
  ],
  "Andhra Pradesh": [
    { name: "Guntur", district: "Guntur", lat: 16.3067, lon: 80.4365 },
    { name: "Kurnool", district: "Kurnool", lat: 15.8281, lon: 78.0373 },
    { name: "Anantapur", district: "Anantapur", lat: 14.6819, lon: 77.6006 },
    { name: "Chittoor", district: "Chittoor", lat: 13.2172, lon: 79.1003 },
    { name: "East Godavari", district: "East Godavari", lat: 16.9891, lon: 82.2475 },
  ],
  Telangana: [
    { name: "Warangal", district: "Warangal", lat: 17.9689, lon: 79.5941 },
    { name: "Nizamabad", district: "Nizamabad", lat: 18.6725, lon: 78.0941 },
    { name: "Khammam", district: "Khammam", lat: 17.2473, lon: 80.1514 },
    { name: "Karimnagar", district: "Karimnagar", lat: 18.4386, lon: 79.1288 },
  ],
  Maharashtra: [
    { name: "Nashik", district: "Nashik", lat: 19.9975, lon: 73.7898 },
    { name: "Pune", district: "Pune", lat: 18.5204, lon: 73.8567 },
    { name: "Nagpur", district: "Nagpur", lat: 21.1458, lon: 79.0882 },
    { name: "Ahmednagar", district: "Ahmednagar", lat: 19.0952, lon: 74.7496 },
    { name: "Solapur", district: "Solapur", lat: 17.6599, lon: 75.9064 },
    { name: "Kolhapur", district: "Kolhapur", lat: 16.705, lon: 74.2433 },
  ],
  Gujarat: [
    { name: "Rajkot", district: "Rajkot", lat: 22.3039, lon: 70.8022 },
    { name: "Junagadh", district: "Junagadh", lat: 21.5222, lon: 70.4579 },
    { name: "Vadodara", district: "Vadodara", lat: 22.3072, lon: 73.1812 },
    { name: "Banaskantha", district: "Banaskantha", lat: 24.1722, lon: 72.4383 },
  ],
  "Madhya Pradesh": [
    { name: "Indore", district: "Indore", lat: 22.7196, lon: 75.8577 },
    { name: "Bhopal", district: "Bhopal", lat: 23.2599, lon: 77.4126 },
    { name: "Jabalpur", district: "Jabalpur", lat: 23.1815, lon: 79.9864 },
    { name: "Ujjain", district: "Ujjain", lat: 23.1765, lon: 75.7885 },
  ],
  "Uttar Pradesh": [
    { name: "Lucknow", district: "Lucknow", lat: 26.8467, lon: 80.9462 },
    { name: "Meerut", district: "Meerut", lat: 28.9845, lon: 77.7064 },
    { name: "Varanasi", district: "Varanasi", lat: 25.3176, lon: 82.9739 },
    { name: "Bareilly", district: "Bareilly", lat: 28.367, lon: 79.4304 },
  ],
  Punjab: [
    { name: "Ludhiana", district: "Ludhiana", lat: 30.901, lon: 75.8573 },
    { name: "Amritsar", district: "Amritsar", lat: 31.634, lon: 74.8723 },
    { name: "Bathinda", district: "Bathinda", lat: 30.211, lon: 74.9455 },
  ],
  Haryana: [
    { name: "Karnal", district: "Karnal", lat: 29.6857, lon: 76.9905 },
    { name: "Hisar", district: "Hisar", lat: 29.1492, lon: 75.7217 },
  ],
  Rajasthan: [
    { name: "Jaipur", district: "Jaipur", lat: 26.9124, lon: 75.7873 },
    { name: "Kota", district: "Kota", lat: 25.2138, lon: 75.8648 },
    { name: "Sri Ganganagar", district: "Sri Ganganagar", lat: 29.9038, lon: 73.8772 },
  ],
  Bihar: [
    { name: "Patna", district: "Patna", lat: 25.5941, lon: 85.1376 },
    { name: "Muzaffarpur", district: "Muzaffarpur", lat: 26.1209, lon: 85.3647 },
    { name: "Bhagalpur", district: "Bhagalpur", lat: 25.2425, lon: 86.9842 },
  ],
  "West Bengal": [
    { name: "Bardhaman", district: "Purba Bardhaman", lat: 23.2324, lon: 87.8615 },
    { name: "Nadia", district: "Nadia", lat: 23.4013, lon: 88.5027 },
    { name: "Siliguri", district: "Darjeeling", lat: 26.7271, lon: 88.3953 },
  ],
  Odisha: [
    { name: "Cuttack", district: "Cuttack", lat: 20.4625, lon: 85.8828 },
    { name: "Sambalpur", district: "Sambalpur", lat: 21.4669, lon: 83.9812 },
  ],
  Assam: [
    { name: "Jorhat", district: "Jorhat", lat: 26.7509, lon: 94.2037 },
    { name: "Nagaon", district: "Nagaon", lat: 26.3464, lon: 92.6840 },
  ],
  Chhattisgarh: [
    { name: "Raipur", district: "Raipur", lat: 21.2514, lon: 81.6296 },
    { name: "Durg", district: "Durg", lat: 21.1904, lon: 81.2849 },
  ],
  Jharkhand: [{ name: "Ranchi", district: "Ranchi", lat: 23.6102, lon: 85.2799 }],
  Uttarakhand: [{ name: "Dehradun", district: "Dehradun", lat: 30.3165, lon: 78.0322 }],
  "Himachal Pradesh": [{ name: "Shimla", district: "Shimla", lat: 31.1048, lon: 77.1734 }],
  Goa: [{ name: "Ponda", district: "North Goa", lat: 15.4027, lon: 74.0078 }],
};

export function placesIn(state: string): Place[] {
  return PLACES[state] ?? [];
}
