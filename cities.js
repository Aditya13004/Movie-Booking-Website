// Comprehensive India cities dataset (curated). Extend as needed.
// Exposes window.INDIA_CITIES_FULL (array of city names) and window.CITY_COORDS_IN (name → {lat, lon}).

(function(){
  const CITY_COORDS_IN = {
    'Mumbai': { lat: 19.076, lon: 72.8777 },
    'Delhi': { lat: 28.6139, lon: 77.209 },
    'Bengaluru': { lat: 12.9716, lon: 77.5946 },
    'Hyderabad': { lat: 17.385, lon: 78.4867 },
    'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
    'Chennai': { lat: 13.0827, lon: 80.2707 },
    'Kolkata': { lat: 22.5726, lon: 88.3639 },
    'Surat': { lat: 21.1702, lon: 72.8311 },
    'Pune': { lat: 18.5204, lon: 73.8567 },
    'Jaipur': { lat: 26.9124, lon: 75.7873 },
    'Lucknow': { lat: 26.8467, lon: 80.9462 },
    'Kanpur': { lat: 26.4499, lon: 80.3319 },
    'Nagpur': { lat: 21.1458, lon: 79.0882 },
    'Indore': { lat: 22.7196, lon: 75.8577 },
    'Thane': { lat: 19.2183, lon: 72.9781 },
    'Bhopal': { lat: 23.2599, lon: 77.4126 },
    'Visakhapatnam': { lat: 17.6868, lon: 83.2185 },
    'Patna': { lat: 25.5941, lon: 85.1376 },
    'Vadodara': { lat: 22.3072, lon: 73.1812 },
    'Ghaziabad': { lat: 28.6692, lon: 77.4538 },
    'Ludhiana': { lat: 30.9009, lon: 75.8573 },
    'Agra': { lat: 27.1767, lon: 78.0081 },
    'Nashik': { lat: 19.9975, lon: 73.7898 },
    'Faridabad': { lat: 28.4089, lon: 77.3178 },
    'Meerut': { lat: 28.9845, lon: 77.7064 },
    'Rajkot': { lat: 22.3039, lon: 70.8022 },
    'Varanasi': { lat: 25.3176, lon: 82.9739 },
    'Srinagar': { lat: 34.0837, lon: 74.7973 },
    'Aurangabad': { lat: 19.8762, lon: 75.3433 },
    'Amritsar': { lat: 31.634, lon: 74.8723 },
    'Navi Mumbai': { lat: 19.033, lon: 73.0297 },
    'Ranchi': { lat: 23.3441, lon: 85.3096 },
    'Howrah': { lat: 22.5958, lon: 88.2636 },
    'Coimbatore': { lat: 11.0168, lon: 76.9558 },
    'Jabalpur': { lat: 23.1815, lon: 79.9864 },
    'Gwalior': { lat: 26.2183, lon: 78.1828 },
    'Vijayawada': { lat: 16.5062, lon: 80.648 },
    'Jodhpur': { lat: 26.2389, lon: 73.0243 },
    'Madurai': { lat: 9.9252, lon: 78.1198 },
    'Raipur': { lat: 21.2514, lon: 81.6296 },
    'Kota': { lat: 25.2138, lon: 75.8648 },
    'Guwahati': { lat: 26.1445, lon: 91.7362 },
    'Chandigarh': { lat: 30.7333, lon: 76.7794 },
    'Mysuru': { lat: 12.2958, lon: 76.6394 },
    'Trivandrum': { lat: 8.5241, lon: 76.9366 },
    'Kochi': { lat: 9.9312, lon: 76.2673 },
    'Noida': { lat: 28.5355, lon: 77.391 },
    'Gurugram': { lat: 28.4595, lon: 77.0266 },
    'Bhubaneswar': { lat: 20.2961, lon: 85.8245 },
    'Dehradun': { lat: 30.3165, lon: 78.0322 },
    'Udaipur': { lat: 24.5854, lon: 73.7125 },
    'Jammu': { lat: 32.7266, lon: 74.857 },
    'Shillong': { lat: 25.5788, lon: 91.8933 },
    'Rourkela': { lat: 22.2604, lon: 84.8536 },
    'Mangalore': { lat: 12.9141, lon: 74.856 },
    'Tirupati': { lat: 13.6288, lon: 79.4192 },
    'Warangal': { lat: 17.9689, lon: 79.5941 },
    'Rajahmundry': { lat: 17.0005, lon: 81.804 },
    'Nellore': { lat: 14.4426, lon: 79.9865 },
    'Tiruchirappalli': { lat: 10.7905, lon: 78.7047 },
    'Salem': { lat: 11.6643, lon: 78.146 },
    'Erode': { lat: 11.341, lon: 77.7172 },
    'Tirunelveli': { lat: 8.7139, lon: 77.7567 },
    'Madikeri': { lat: 12.4244, lon: 75.7382 },
    'Panaji': { lat: 15.4909, lon: 73.8278 },
    'Margao': { lat: 15.2832, lon: 73.9862 },
    'Pondicherry': { lat: 11.9139, lon: 79.8145 },
    'Aizawl': { lat: 23.7271, lon: 92.7176 },
    'Imphal': { lat: 24.817, lon: 93.9368 },
    'Itanagar': { lat: 27.0844, lon: 93.6053 },
    'Gangtok': { lat: 27.3314, lon: 88.6138 },
    'Port Blair': { lat: 11.6234, lon: 92.7265 }
  };

  const INDIA_CITIES_FULL = Object.keys(CITY_COORDS_IN).concat([
    'Ajmer','Akola','Aligarh','Allahabad','Amravati','Ambernath','Ambattur','Bareilly','Belgaum','Bhiwandi','Bhopal','Bikaner','Bilaspur','Chandrapur','Chittoor','Cuttack','Davanagere','Dhanbad','Durgapur','Gandhinagar','Gaya','Guntur','Gwalior','Hisar','Hubballi-Dharwad','Jabalpur','Jalandhar','Jamnagar','Jamshedpur','Jhansi','Jodhpur','Jorhat','Kakinada','Kalyan-Dombivli','Kanchipuram','Kannur','Karnal','Karur','Kasargod','Khammam','Kirkee','Kolhapur','Kollam','Kota','Kozhikode','Kurnool','Latur','Loni','Madurai','Malegaon','Mathura','Meerut','Moradabad','Muzaffarpur','Mysuru','Nadiad','Nanded','Nashik','Navi Mumbai','Palakkad','Panipat','Pathankot','Patiala','Patna','Pimpri-Chinchwad','Puducherry','Pune','Raichur','Raipur','Rajkot','Ranchi','Rewa','Rohtak','Salem','Satara','Shillong','Shimla','Sikar','Siliguri','Solapur','Sonipat','Srinagar','Surat','Thane','Thiruvananthapuram','Thrissur','Tiruchirappalli','Tirunelveli','Tirupati','Tiruppur','Tumkur','Udaipur','Ujjain','Ulhasnagar','Vadodara','Varanasi','Vasai-Virar','Vijayawada','Visakhapatnam','Warangal']
  ).sort();

  window.CITY_COORDS_IN = { ...(window.CITY_COORDS_IN||{}), ...CITY_COORDS_IN };
  window.INDIA_CITIES_FULL = Array.from(new Set([...(window.INDIA_CITIES_FULL||[]), ...INDIA_CITIES_FULL])).sort();
})();










