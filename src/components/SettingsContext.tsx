import React, { createContext, useContext, useState, useEffect } from 'react';

// Comprehensive timezone list with proper timezone identifiers
export const TIMEZONES = [
  { code: 'UTC-12', name: 'Baker Island Time', offset: -12 },
  { code: 'UTC-11', name: 'Hawaii-Aleutian Standard Time', offset: -11 },
  { code: 'UTC-10', name: 'Hawaii Standard Time', offset: -10 },
  { code: 'UTC-9:30', name: 'Marquesas Time', offset: -9.5 },
  { code: 'UTC-9', name: 'Alaska Standard Time', offset: -9 },
  { code: 'UTC-8', name: 'Pacific Standard Time', offset: -8 },
  { code: 'UTC-7', name: 'Mountain Standard Time', offset: -7 },
  { code: 'UTC-6', name: 'Central Standard Time', offset: -6 },
  { code: 'UTC-5', name: 'Eastern Standard Time', offset: -5 },
  { code: 'UTC-4:30', name: 'Venezuelan Standard Time', offset: -4.5 },
  { code: 'UTC-4', name: 'Atlantic Standard Time', offset: -4 },
  { code: 'UTC-3:30', name: 'Newfoundland Standard Time', offset: -3.5 },
  { code: 'UTC-3', name: 'Argentina Time', offset: -3 },
  { code: 'UTC-2', name: 'South Georgia Time', offset: -2 },
  { code: 'UTC-1', name: 'Azores Time', offset: -1 },
  { code: 'UTC+0', name: 'Coordinated Universal Time', offset: 0 },
  { code: 'UTC+1', name: 'Central European Time', offset: 1 },
  { code: 'UTC+2', name: 'Eastern European Time', offset: 2 },
  { code: 'UTC+3', name: 'Moscow Time', offset: 3 },
  { code: 'UTC+3:30', name: 'Iran Standard Time', offset: 3.5 },
  { code: 'UTC+4', name: 'Gulf Standard Time', offset: 4 },
  { code: 'UTC+4:30', name: 'Afghanistan Time', offset: 4.5 },
  { code: 'UTC+5', name: 'Pakistan Standard Time', offset: 5 },
  { code: 'UTC+5:30', name: 'India Standard Time', offset: 5.5 },
  { code: 'UTC+5:45', name: 'Nepal Time', offset: 5.75 },
  { code: 'UTC+6', name: 'Bangladesh Standard Time', offset: 6 },
  { code: 'UTC+6:30', name: 'Myanmar Time', offset: 6.5 },
  { code: 'UTC+7', name: 'Indochina Time', offset: 7 },
  { code: 'UTC+8', name: 'China Standard Time', offset: 8 },
  { code: 'UTC+8:30', name: 'North Korean Time', offset: 8.5 },
  { code: 'UTC+9', name: 'Japan Standard Time', offset: 9 },
  { code: 'UTC+9:30', name: 'Australian Central Standard Time', offset: 9.5 },
  { code: 'UTC+10', name: 'Australian Eastern Time', offset: 10 },
  { code: 'UTC+10:30', name: 'Lord Howe Standard Time', offset: 10.5 },
  { code: 'UTC+11', name: 'Solomon Islands Time', offset: 11 },
  { code: 'UTC+12', name: 'New Zealand Time', offset: 12 },
  { code: 'UTC+12:45', name: 'Chatham Standard Time', offset: 12.75 },
  { code: 'UTC+13', name: 'Tonga Time', offset: 13 },
  { code: 'UTC+14', name: 'Line Islands Time', offset: 14 },
];

// Comprehensive locations list
export const LOCATIONS = [
  // North America
  { code: 'US-NY', name: 'New York, USA', country: 'United States' },
  { code: 'US-CA', name: 'Los Angeles, USA', country: 'United States' },
  { code: 'US-IL', name: 'Chicago, USA', country: 'United States' },
  { code: 'US-TX', name: 'Houston, USA', country: 'United States' },
  { code: 'US-FL', name: 'Miami, USA', country: 'United States' },
  { code: 'US-WA', name: 'Seattle, USA', country: 'United States' },
  { code: 'US-MA', name: 'Boston, USA', country: 'United States' },
  { code: 'US-NV', name: 'Las Vegas, USA', country: 'United States' },
  { code: 'CA-TO', name: 'Toronto, Canada', country: 'Canada' },
  { code: 'CA-VA', name: 'Vancouver, Canada', country: 'Canada' },
  { code: 'CA-MO', name: 'Montreal, Canada', country: 'Canada' },
  { code: 'CA-CA', name: 'Calgary, Canada', country: 'Canada' },
  { code: 'MX-MX', name: 'Mexico City, Mexico', country: 'Mexico' },
  { code: 'MX-GD', name: 'Guadalajara, Mexico', country: 'Mexico' },
  { code: 'MX-MO', name: 'Monterrey, Mexico', country: 'Mexico' },
  
  // South America
  { code: 'BR-SP', name: 'São Paulo, Brazil', country: 'Brazil' },
  { code: 'BR-RJ', name: 'Rio de Janeiro, Brazil', country: 'Brazil' },
  { code: 'BR-BS', name: 'Brasília, Brazil', country: 'Brazil' },
  { code: 'BR-SV', name: 'Salvador, Brazil', country: 'Brazil' },
  { code: 'AR-BA', name: 'Buenos Aires, Argentina', country: 'Argentina' },
  { code: 'AR-CO', name: 'Córdoba, Argentina', country: 'Argentina' },
  { code: 'CL-ST', name: 'Santiago, Chile', country: 'Chile' },
  { code: 'CL-VA', name: 'Valparaíso, Chile', country: 'Chile' },
  { code: 'CO-BO', name: 'Bogotá, Colombia', country: 'Colombia' },
  { code: 'CO-ME', name: 'Medellín, Colombia', country: 'Colombia' },
  { code: 'PE-LI', name: 'Lima, Peru', country: 'Peru' },
  { code: 'UY-MO', name: 'Montevideo, Uruguay', country: 'Uruguay' },
  { code: 'VE-CA', name: 'Caracas, Venezuela', country: 'Venezuela' },
  
  // Europe
  { code: 'GB-LN', name: 'London, UK', country: 'United Kingdom' },
  { code: 'GB-MA', name: 'Manchester, UK', country: 'United Kingdom' },
  { code: 'GB-ED', name: 'Edinburgh, UK', country: 'United Kingdom' },
  { code: 'FR-PA', name: 'Paris, France', country: 'France' },
  { code: 'FR-LY', name: 'Lyon, France', country: 'France' },
  { code: 'FR-MA', name: 'Marseille, France', country: 'France' },
  { code: 'DE-BE', name: 'Berlin, Germany', country: 'Germany' },
  { code: 'DE-MU', name: 'Munich, Germany', country: 'Germany' },
  { code: 'DE-HA', name: 'Hamburg, Germany', country: 'Germany' },
  { code: 'IT-RM', name: 'Rome, Italy', country: 'Italy' },
  { code: 'IT-MI', name: 'Milan, Italy', country: 'Italy' },
  { code: 'IT-NA', name: 'Naples, Italy', country: 'Italy' },
  { code: 'ES-MD', name: 'Madrid, Spain', country: 'Spain' },
  { code: 'ES-BC', name: 'Barcelona, Spain', country: 'Spain' },
  { code: 'ES-SE', name: 'Seville, Spain', country: 'Spain' },
  { code: 'PT-LI', name: 'Lisbon, Portugal', country: 'Portugal' },
  { code: 'PT-PO', name: 'Porto, Portugal', country: 'Portugal' },
  { code: 'NL-AM', name: 'Amsterdam, Netherlands', country: 'Netherlands' },
  { code: 'NL-RO', name: 'Rotterdam, Netherlands', country: 'Netherlands' },
  { code: 'BE-BR', name: 'Brussels, Belgium', country: 'Belgium' },
  { code: 'BE-AN', name: 'Antwerp, Belgium', country: 'Belgium' },
  { code: 'CH-ZU', name: 'Zurich, Switzerland', country: 'Switzerland' },
  { code: 'CH-GE', name: 'Geneva, Switzerland', country: 'Switzerland' },
  { code: 'AT-VI', name: 'Vienna, Austria', country: 'Austria' },
  { code: 'AT-SA', name: 'Salzburg, Austria', country: 'Austria' },
  { code: 'SE-ST', name: 'Stockholm, Sweden', country: 'Sweden' },
  { code: 'SE-GO', name: 'Gothenburg, Sweden', country: 'Sweden' },
  { code: 'NO-OS', name: 'Oslo, Norway', country: 'Norway' },
  { code: 'NO-BE', name: 'Bergen, Norway', country: 'Norway' },
  { code: 'DK-CO', name: 'Copenhagen, Denmark', country: 'Denmark' },
  { code: 'FI-HE', name: 'Helsinki, Finland', country: 'Finland' },
  { code: 'PL-WA', name: 'Warsaw, Poland', country: 'Poland' },
  { code: 'PL-KR', name: 'Krakow, Poland', country: 'Poland' },
  { code: 'CZ-PR', name: 'Prague, Czech Republic', country: 'Czech Republic' },
  { code: 'HU-BU', name: 'Budapest, Hungary', country: 'Hungary' },
  { code: 'RO-BU', name: 'Bucharest, Romania', country: 'Romania' },
  { code: 'BG-SO', name: 'Sofia, Bulgaria', country: 'Bulgaria' },
  { code: 'HR-ZA', name: 'Zagreb, Croatia', country: 'Croatia' },
  { code: 'RS-BE', name: 'Belgrade, Serbia', country: 'Serbia' },
  { code: 'UA-KI', name: 'Kyiv, Ukraine', country: 'Ukraine' },
  { code: 'RU-MO', name: 'Moscow, Russia', country: 'Russia' },
  { code: 'RU-SP', name: 'St. Petersburg, Russia', country: 'Russia' },
  { code: 'TR-IS', name: 'Istanbul, Turkey', country: 'Turkey' },
  { code: 'TR-AN', name: 'Ankara, Turkey', country: 'Turkey' },
  { code: 'GR-AT', name: 'Athens, Greece', country: 'Greece' },
  
  // Asia
  { code: 'JP-TK', name: 'Tokyo, Japan', country: 'Japan' },
  { code: 'JP-OS', name: 'Osaka, Japan', country: 'Japan' },
  { code: 'JP-KY', name: 'Kyoto, Japan', country: 'Japan' },
  { code: 'CN-BJ', name: 'Beijing, China', country: 'China' },
  { code: 'CN-SH', name: 'Shanghai, China', country: 'China' },
  { code: 'CN-GZ', name: 'Guangzhou, China', country: 'China' },
  { code: 'CN-SZ', name: 'Shenzhen, China', country: 'China' },
  { code: 'HK-HK', name: 'Hong Kong', country: 'Hong Kong' },
  { code: 'TW-TP', name: 'Taipei, Taiwan', country: 'Taiwan' },
  { code: 'KR-SE', name: 'Seoul, South Korea', country: 'South Korea' },
  { code: 'KR-BU', name: 'Busan, South Korea', country: 'South Korea' },
  { code: 'IN-DL', name: 'New Delhi, India', country: 'India' },
  { code: 'IN-MB', name: 'Mumbai, India', country: 'India' },
  { code: 'IN-BL', name: 'Bangalore, India', country: 'India' },
  { code: 'IN-CH', name: 'Chennai, India', country: 'India' },
  { code: 'IN-KO', name: 'Kolkata, India', country: 'India' },
  { code: 'IN-HY', name: 'Hyderabad, India', country: 'India' },
  { code: 'PK-KA', name: 'Karachi, Pakistan', country: 'Pakistan' },
  { code: 'PK-LA', name: 'Lahore, Pakistan', country: 'Pakistan' },
  { code: 'BD-DH', name: 'Dhaka, Bangladesh', country: 'Bangladesh' },
  { code: 'LK-CO', name: 'Colombo, Sri Lanka', country: 'Sri Lanka' },
  { code: 'NP-KA', name: 'Kathmandu, Nepal', country: 'Nepal' },
  { code: 'TH-BK', name: 'Bangkok, Thailand', country: 'Thailand' },
  { code: 'TH-CM', name: 'Chiang Mai, Thailand', country: 'Thailand' },
  { code: 'VN-HO', name: 'Ho Chi Minh City, Vietnam', country: 'Vietnam' },
  { code: 'VN-HA', name: 'Hanoi, Vietnam', country: 'Vietnam' },
  { code: 'MY-KL', name: 'Kuala Lumpur, Malaysia', country: 'Malaysia' },
  { code: 'SG-SG', name: 'Singapore', country: 'Singapore' },
  { code: 'ID-JA', name: 'Jakarta, Indonesia', country: 'Indonesia' },
  { code: 'ID-SU', name: 'Surabaya, Indonesia', country: 'Indonesia' },
  { code: 'PH-MA', name: 'Manila, Philippines', country: 'Philippines' },
  { code: 'PH-CE', name: 'Cebu, Philippines', country: 'Philippines' },
  
  // Middle East
  { code: 'AE-DU', name: 'Dubai, UAE', country: 'United Arab Emirates' },
  { code: 'AE-AD', name: 'Abu Dhabi, UAE', country: 'United Arab Emirates' },
  { code: 'SA-RI', name: 'Riyadh, Saudi Arabia', country: 'Saudi Arabia' },
  { code: 'SA-JE', name: 'Jeddah, Saudi Arabia', country: 'Saudi Arabia' },
  { code: 'QA-DO', name: 'Doha, Qatar', country: 'Qatar' },
  { code: 'KW-KW', name: 'Kuwait City, Kuwait', country: 'Kuwait' },
  { code: 'BH-MA', name: 'Manama, Bahrain', country: 'Bahrain' },
  { code: 'OM-MU', name: 'Muscat, Oman', country: 'Oman' },
  { code: 'IL-TE', name: 'Tel Aviv, Israel', country: 'Israel' },
  { code: 'IL-JE', name: 'Jerusalem, Israel', country: 'Israel' },
  { code: 'JO-AM', name: 'Amman, Jordan', country: 'Jordan' },
  { code: 'LB-BE', name: 'Beirut, Lebanon', country: 'Lebanon' },
  { code: 'IR-TE', name: 'Tehran, Iran', country: 'Iran' },
  { code: 'IR-IS', name: 'Isfahan, Iran', country: 'Iran' },
  { code: 'IQ-BA', name: 'Baghdad, Iraq', country: 'Iraq' },
  
  // Africa
  { code: 'EG-CA', name: 'Cairo, Egypt', country: 'Egypt' },
  { code: 'EG-AL', name: 'Alexandria, Egypt', country: 'Egypt' },
  { code: 'ZA-JO', name: 'Johannesburg, South Africa', country: 'South Africa' },
  { code: 'ZA-CA', name: 'Cape Town, South Africa', country: 'South Africa' },
  { code: 'ZA-DU', name: 'Durban, South Africa', country: 'South Africa' },
  { code: 'NG-LA', name: 'Lagos, Nigeria', country: 'Nigeria' },
  { code: 'NG-AB', name: 'Abuja, Nigeria', country: 'Nigeria' },
  { code: 'KE-NA', name: 'Nairobi, Kenya', country: 'Kenya' },
  { code: 'ET-AD', name: 'Addis Ababa, Ethiopia', country: 'Ethiopia' },
  { code: 'GH-AC', name: 'Accra, Ghana', country: 'Ghana' },
  { code: 'MA-CA', name: 'Casablanca, Morocco', country: 'Morocco' },
  { code: 'MA-RA', name: 'Rabat, Morocco', country: 'Morocco' },
  { code: 'TN-TU', name: 'Tunis, Tunisia', country: 'Tunisia' },
  { code: 'DZ-AL', name: 'Algiers, Algeria', country: 'Algeria' },
  
  // Oceania
  { code: 'AU-SY', name: 'Sydney, Australia', country: 'Australia' },
  { code: 'AU-ME', name: 'Melbourne, Australia', country: 'Australia' },
  { code: 'AU-BR', name: 'Brisbane, Australia', country: 'Australia' },
  { code: 'AU-PE', name: 'Perth, Australia', country: 'Australia' },
  { code: 'AU-AD', name: 'Adelaide, Australia', country: 'Australia' },
  { code: 'NZ-AU', name: 'Auckland, New Zealand', country: 'New Zealand' },
  { code: 'NZ-WE', name: 'Wellington, New Zealand', country: 'New Zealand' },
  { code: 'NZ-CH', name: 'Christchurch, New Zealand', country: 'New Zealand' },
];

// Comprehensive languages with professional translations
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskera' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
];

// Comprehensive currency list
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
];

import { TRANSLATIONS } from './translations';

// Mock weather data for different locations
export const WEATHER_DATA = {
  'US-NY': { temperature: 22, condition: 'Partly Cloudy' },
  'US-CA': { temperature: 28, condition: 'Sunny' },
  'US-IL': { temperature: 20, condition: 'Cloudy' },
  'US-TX': { temperature: 30, condition: 'Sunny' },
  'US-FL': { temperature: 32, condition: 'Sunny' },
  'US-WA': { temperature: 18, condition: 'Rainy' },
  'US-MA': { temperature: 19, condition: 'Cloudy' },
  'US-NV': { temperature: 35, condition: 'Sunny' },
  'GB-LN': { temperature: 15, condition: 'Cloudy' },
  'FR-PA': { temperature: 18, condition: 'Partly Cloudy' },
  'DE-BE': { temperature: 16, condition: 'Cloudy' },
  'IT-RM': { temperature: 25, condition: 'Sunny' },
  'ES-MD': { temperature: 26, condition: 'Sunny' },
  'JP-TK': { temperature: 21, condition: 'Partly Cloudy' },
  'CN-BJ': { temperature: 19, condition: 'Cloudy' },
  'CN-SH': { temperature: 23, condition: 'Partly Cloudy' },
  'KR-SE': { temperature: 18, condition: 'Cloudy' },
  'IN-DL': { temperature: 32, condition: 'Sunny' },
  'IN-MB': { temperature: 29, condition: 'Partly Cloudy' },
  'AU-SY': { temperature: 24, condition: 'Sunny' },
  'AU-ME': { temperature: 22, condition: 'Partly Cloudy' },
  'BR-SP': { temperature: 26, condition: 'Partly Cloudy' },
  'BR-RJ': { temperature: 28, condition: 'Sunny' },
  'MX-MX': { temperature: 24, condition: 'Partly Cloudy' },
  'CA-TO': { temperature: 17, condition: 'Cloudy' },
  'CA-VA': { temperature: 19, condition: 'Rainy' },
  'RU-MO': { temperature: 12, condition: 'Cloudy' },
  'ZA-JO': { temperature: 21, condition: 'Sunny' },
  'EG-CA': { temperature: 31, condition: 'Sunny' },
  'AE-DU': { temperature: 35, condition: 'Sunny' },
  'SG-SG': { temperature: 30, condition: 'Partly Cloudy' },
  'TH-BK': { temperature: 33, condition: 'Partly Cloudy' },
  'AR-BA': { temperature: 20, condition: 'Cloudy' },
  'CL-ST': { temperature: 18, condition: 'Partly Cloudy' },
  // Default for any location not in the list
  default: { temperature: 22, condition: 'Partly Cloudy' },
};

interface SettingsContextType {
  language: string;
  location: string;
  timezone: string;
  currency: string;
  setLanguage: (lang: string) => void;
  setLocation: (loc: string) => void;
  setTimezone: (tz: string) => void;
  setCurrency: (curr: string) => void;
  translate: (key: string) => string;
  getCurrentTime: () => Date;
  getLocationName: () => string;
  getWeatherData: () => { temperature: number; condition: string };
  getCurrencyInfo: () => { code: string; name: string; symbol: string };
}

type SettingsProviderProps = {
  children: React.ReactNode;
  initialSettings?: Partial<Pick<SettingsContextType, 'language' | 'location' | 'timezone' | 'currency'>>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children, initialSettings }) => {
  const [language, setLanguageState] = useState('en');
  const [location, setLocationState] = useState('US-NY');
  const [timezone, setTimezoneState] = useState('UTC-5');
  const [currency, setCurrencyState] = useState('USD');
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [liveWeather, setLiveWeather] = useState<{ temperature: number; condition: string } | null>(null);

  // Load saved settings from localStorage on mount (only for language and currency - manual preferences)
  // Location and timezone come from user profile (GPS-based) via initialSettings
  useEffect(() => {
    // Clear old location/timezone from localStorage if they exist (migration cleanup)
    localStorage.removeItem('smartmeter_location');
    localStorage.removeItem('smartmeter_timezone');
    
    const savedLanguage = localStorage.getItem('smartmeter_language');
    const savedCurrency = localStorage.getItem('smartmeter_currency');
    const savedGeo = localStorage.getItem('smartmeter_geo_coords');

    if (savedLanguage) setLanguageState(savedLanguage);
    if (savedCurrency) setCurrencyState(savedCurrency);
    if (savedGeo) {
      try {
        const parsed = JSON.parse(savedGeo);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number') {
          console.log('SettingsContext: Initial mount - setting geo coords:', parsed);
          setGeoCoords({ lat: parsed.lat, lon: parsed.lon });
        }
      } catch (err) {
        console.error('SettingsContext: Error parsing initial geo coords:', err);
      }
    } else {
      console.log('SettingsContext: No saved geo coords found on mount');
    }
  }, []);

  useEffect(() => {
    if (!initialSettings) return;
    
    console.log('SettingsContext: Received initialSettings:', initialSettings);
    
    if (initialSettings.language) setLanguageState(initialSettings.language);
    if (initialSettings.location) {
      console.log('SettingsContext: Setting location to:', initialSettings.location);
      setLocationState(initialSettings.location);
    }
    if (initialSettings.timezone) {
      console.log('SettingsContext: Setting timezone to:', initialSettings.timezone);
      setTimezoneState(initialSettings.timezone);
    }
    if (initialSettings.currency) setCurrencyState(initialSettings.currency);
    
    // Check for geo coordinates in localStorage whenever settings change
    const savedGeo = localStorage.getItem('smartmeter_geo_coords');
    console.log('SettingsContext: Checking for saved geo coords:', savedGeo);
    if (savedGeo) {
      try {
        const parsed = JSON.parse(savedGeo);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lon === 'number') {
          console.log('SettingsContext: Setting geo coords:', parsed);
          setGeoCoords({ lat: parsed.lat, lon: parsed.lon });
        }
      } catch (err) {
        console.error('SettingsContext: Error parsing geo coords:', err);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSettings?.language, initialSettings?.location, initialSettings?.timezone, initialSettings?.currency]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('smartmeter_language', lang);
  };

  const setLocation = (loc: string) => {
    setLocationState(loc);
    // Don't save to localStorage - location comes from user profile (GPS-based)
    // localStorage.setItem('smartmeter_location', loc);
  };

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
    // Don't save to localStorage - timezone comes from user profile (GPS-based)
    // localStorage.setItem('smartmeter_timezone', tz);
  };

  const setCurrency = (curr: string) => {
    setCurrencyState(curr);
    localStorage.setItem('smartmeter_currency', curr);
  };

  const translate = (key: string): string => {
    if (!key) return '';
    
    // First try current language
    if ((TRANSLATIONS as any)[language] && (TRANSLATIONS as any)[language][key]) {
      return (TRANSLATIONS as any)[language][key];
    }
    
    // Fallback to English
    if ((TRANSLATIONS as any)['en'] && (TRANSLATIONS as any)['en'][key]) {
      return (TRANSLATIONS as any)['en'][key];
    }
    
    // Final fallback to the key itself
    return key;
  };

  const IANA_OFFSETS: Record<string, number> = {
    'Asia/Kolkata': 5.5,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'Europe/London': 0,
    'Europe/Paris': 1,
    'Europe/Berlin': 1,
    'Asia/Tokyo': 9,
    'Asia/Seoul': 9,
    'Asia/Singapore': 8,
    'Australia/Sydney': 10,
  };

  const getCurrentTime = (): Date => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    let offset = TIMEZONES.find(tz => tz.code === timezone)?.offset;
    
    // If not found in TIMEZONES array, try to parse the timezone string directly
    if (offset === undefined) {
      if (timezone.includes('/')) {
        // IANA timezone format (e.g., 'Asia/Kolkata')
        offset = IANA_OFFSETS[timezone] ?? 0;
      } else if (timezone.startsWith('UTC') || timezone.startsWith('GMT')) {
        // Parse UTC/GMT offset format (e.g., 'GMT+5:30', 'UTC+5.5', 'GMT-5:00')
        const match = timezone.match(/(UTC|GMT)([+-]?)(\d+):?(\d+)?/);
        if (match) {
          const sign = match[2] === '-' ? -1 : 1;
          const hours = parseFloat(match[3]);
          const minutes = match[4] ? parseFloat(match[4]) : 0;
          offset = sign * (hours + minutes / 60);
        }
      }
    }
    
    console.log('SettingsContext: getCurrentTime - timezone:', timezone, 'offset:', offset);
    return new Date(utc + (Number(offset || 0) * 3600000));
  };

  const getLocationName = (): string => {
    console.log('SettingsContext: getLocationName called, current location state:', location);
    
    // First try to find by code (for backward compatibility with preset locations)
    const found = LOCATIONS.find(loc => loc.code === location);
    if (found) {
      console.log('SettingsContext: Found location by code:', found.name);
      return found.name;
    }
    
    // If no code match, check if location is already a display string (e.g., from GPS)
    // Location from GPS will be like "City, State, Country" or "City, Country"
    if (location && location.includes(',')) {
      console.log('SettingsContext: Using GPS location string:', location);
      return location;
    }
    
    console.log('SettingsContext: Returning fallback location');
    return location || 'Unknown Location';
  };

  // Fetch live weather using Open-Meteo if geo coordinates are available
  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      if (!geoCoords) {
        console.log('SettingsContext: No geo coords, skipping weather fetch');
        return;
      }
      console.log('SettingsContext: Fetching weather for coords:', geoCoords);
      try {
        const cacheKey = 'smartmeter_weather_cache';
        const cached = localStorage.getItem(cacheKey);
        console.log('SettingsContext: Weather cache value:', cached);
        
        let shouldFetchFresh = true;
        
        if (cached) {
          try {
            const { ts, data, coords } = JSON.parse(cached);
            console.log('SettingsContext: Parsed cache - ts:', ts, 'coords:', coords, 'data:', data);
            console.log('SettingsContext: Current coords:', geoCoords);
            console.log('SettingsContext: Coords match:', coords?.lat === geoCoords.lat && coords?.lon === geoCoords.lon);
            console.log('SettingsContext: Cache age (ms):', Date.now() - ts);
            // Check if cache is for the same coordinates and within 15 minutes
            if (coords?.lat === geoCoords.lat && coords?.lon === geoCoords.lon && Date.now() - ts < 15 * 60 * 1000) {
              console.log('SettingsContext: Using cached weather:', data);
              setLiveWeather(data);
              shouldFetchFresh = false;
            } else {
              console.log('SettingsContext: Cache is for different location or expired, fetching fresh data');
            }
          } catch (parseError) {
            console.error('SettingsContext: Error parsing cache:', parseError);
          }
        } else {
          console.log('SettingsContext: No cache found, will fetch fresh data');
        }
        
        if (!shouldFetchFresh) {
          console.log('SettingsContext: Using cache, skipping API fetch');
          return;
        }
        
        // Using OpenWeatherMap API - Same accuracy as Google Weather
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '2e848c3f88769f52edd7d7be37bb762a';
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${geoCoords.lat}&lon=${geoCoords.lon}&appid=${apiKey}&units=metric`;
        console.log('SettingsContext: Fetching weather from OpenWeatherMap:', url);
        const res = await fetch(url);
        console.log('SettingsContext: API response status:', res.status, res.ok);
        if (!res.ok) throw new Error('weather fetch failed');
        const json = await res.json();
        console.log('SettingsContext: OpenWeatherMap API response:', json);
        
        const temp = json?.main?.temp;
        const weatherMain = json?.weather?.[0]?.main;
        const weatherDesc = json?.weather?.[0]?.description;
        console.log('SettingsContext: Extracted temp:', temp, 'main:', weatherMain, 'desc:', weatherDesc);
        
        // Map OpenWeatherMap conditions to display format (matches Google exactly)
        const conditionMap: Record<string, string> = {
          'Clear': 'Sunny',
          'Clouds': 'Cloudy',
          'Rain': 'Rainy',
          'Drizzle': 'Drizzle',
          'Thunderstorm': 'Stormy',
          'Snow': 'Snowy',
          'Mist': 'Foggy',
          'Fog': 'Foggy',
          'Haze': 'Partly Cloudy',
          'Smoke': 'Foggy',
          'Dust': 'Foggy',
          'Sand': 'Foggy',
          'Ash': 'Foggy',
          'Squall': 'Stormy',
          'Tornado': 'Stormy'
        };
        
        let condition = conditionMap[weatherMain] || 'Partly Cloudy';
        
        // Refine based on description for better accuracy
        if (weatherMain === 'Clouds') {
          if (weatherDesc.includes('few') || weatherDesc.includes('scattered')) {
            condition = 'Partly Cloudy';
          } else if (weatherDesc.includes('broken') || weatherDesc.includes('overcast')) {
            condition = 'Cloudy';
          }
        }
        
        const data = { temperature: typeof temp === 'number' ? Math.round(temp) : 0, condition };
        console.log('SettingsContext: Setting live weather:', data);
        console.log('SettingsContext: Cancelled flag before setState:', cancelled);
        // Don't check cancelled flag here - we want to update state with the fetched data
        setLiveWeather(data);
        // Store cache with coordinates to ensure we don't use old location's weather
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data, coords: geoCoords }));
      } catch (error) {
        console.error('SettingsContext: Weather fetch error:', error);
      }
    };
    fetchWeather();
    return () => {
      cancelled = true;
      console.log('SettingsContext: Weather fetch cleanup, cancelled:', cancelled);
    };
  }, [geoCoords]);

  const getWeatherData = () => {
    // Prioritize live weather if available
    if (liveWeather) return liveWeather;
    
    // Try location code lookup for static weather data
    const staticWeather = (WEATHER_DATA as any)[location];
    if (staticWeather) return staticWeather;
    
    // If location is a GPS string like "New York, New York, United States",
    // try to match it to a location code in WEATHER_DATA
    if (location && location.includes(',')) {
      const cityPart = location.split(',')[0].trim();
      // Try to find matching location code by city name
      const matchedLocation = LOCATIONS.find(loc => 
        loc.name.toLowerCase().includes(cityPart.toLowerCase())
      );
      if (matchedLocation && (WEATHER_DATA as any)[matchedLocation.code]) {
        return (WEATHER_DATA as any)[matchedLocation.code];
      }
    }
    
    return WEATHER_DATA.default;
  };

  const getCurrencyInfo = () => {
    return CURRENCIES.find(curr => curr.code === currency) || CURRENCIES[0];
  };

  return (
    <SettingsContext.Provider value={{
      language,
      location,
      timezone,
      currency,
      setLanguage,
      setLocation,
      setTimezone,
      setCurrency,
      translate,
      getCurrentTime,
      getLocationName,
      getWeatherData,
      getCurrencyInfo,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};