export const API_VERSION = '14.0'
export const CANARY_API_VERSION = '16.0'
export const CURRENCY_ISO_CODES = new Set([
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BOV',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHE',
  'CHF',
  'CHW',
  'CLF',
  'CLP',
  'CNY',
  'COP',
  'COU',
  'CRC',
  'CUC',
  'CUP',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'IQD',
  'IRR',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KPW',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRU',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MXV',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SDG',
  'SEK',
  'SGD',
  'SHP',
  'SLL',
  'SOS',
  'SRD',
  'SSP',
  'STN',
  'SVC',
  'SYP',
  'SZL',
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'USN',
  'UYI',
  'UYU',
  'UYW',
  'UZS',
  'VES',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XAG',
  'XAU',
  'XBA',
  'XBB',
  'XBC',
  'XBD',
  'XCD',
  'XDR',
  'XOF',
  'XPD',
  'XPF',
  'XPT',
  'XSU',
  'XTS',
  'XUA',
  'XXX',
  'YER',
  'ZAR',
  'ZMW',
  'ZWC'
])

export const US_STATE_CODES = new Map<string, string>([
  ['arizona', 'az'],
  ['alabama', 'al'],
  ['alaska', 'ak'],
  ['arkansas', 'ar'],
  ['california', 'ca'],
  ['colorado', 'co'],
  ['connecticut', 'ct'],
  ['delaware', 'de'],
  ['florida', 'fl'],
  ['georgia', 'ga'],
  ['hawaii', 'hi'],
  ['idaho', 'id'],
  ['illinois', 'il'],
  ['indiana', 'in'],
  ['iowa', 'ia'],
  ['kansas', 'ks'],
  ['kentucky', 'ky'],
  ['louisiana', 'la'],
  ['maine', 'me'],
  ['maryland', 'md'],
  ['massachusetts', 'ma'],
  ['michigan', 'mi'],
  ['minnesota', 'mn'],
  ['mississippi', 'ms'],
  ['missouri', 'mo'],
  ['montana', 'mt'],
  ['nebraska', 'ne'],
  ['nevada', 'nv'],
  ['newhampshire', 'nh'],
  ['newjersey', 'nj'],
  ['newmexico', 'nm'],
  ['newyork', 'ny'],
  ['northcarolina', 'nc'],
  ['northdakota', 'nd'],
  ['ohio', 'oh'],
  ['oklahoma', 'ok'],
  ['oregon', 'or'],
  ['pennsylvania', 'pa'],
  ['rhodeisland', 'ri'],
  ['southcarolina', 'sc'],
  ['southdakota', 'sd'],
  ['tennessee', 'tn'],
  ['texas', 'tx'],
  ['utah', 'ut'],
  ['vermont', 'vt'],
  ['virginia', 'va'],
  ['washington', 'wa'],
  ['westvirginia', 'wv'],
  ['wisconsin', 'wi'],
  ['wyoming', 'wy']
])

export const COUNTRY_CODES = new Map<string, string>([
  ['afghanistan', 'af'],
  ['alandislands', 'ax'],
  ['albania', 'al'],
  ['algeria', 'dz'],
  ['americansamoa', 'as'],
  ['andorra', 'ad'],
  ['angola', 'ao'],
  ['anguilla', 'ai'],
  ['antarctica', 'aq'],
  ['antiguaandbarbuda', 'ag'],
  ['argentina', 'ar'],
  ['armenia', 'am'],
  ['aruba', 'aw'],
  ['australia', 'au'],
  ['austria', 'at'],
  ['azerbaijan', 'az'],
  ['bahamas', 'bs'],
  ['bahrain', 'bh'],
  ['bangladesh', 'bd'],
  ['barbados', 'bb'],
  ['belarus', 'by'],
  ['belgium', 'be'],
  ['belize', 'bz'],
  ['benin', 'bj'],
  ['bermuda', 'bm'],
  ['bhutan', 'bt'],
  ['bolivia', 'bo'],
  ['bosniaandherzegovina', 'ba'],
  ['botswana', 'bw'],
  ['bouvetisland', 'bv'],
  ['brazil', 'br'],
  ['britishindianoceanterritory', 'io'],
  ['bruneidarussalam', 'bn'],
  ['bulgaria', 'bg'],
  ['burkinafaso', 'bf'],
  ['burundi', 'bi'],
  ['cambodia', 'kh'],
  ['cameroon', 'cm'],
  ['canada', 'ca'],
  ['capeverde', 'cv'],
  ['caymanislands', 'ky'],
  ['centralafricanrepublic', 'cf'],
  ['chad', 'td'],
  ['chile', 'cl'],
  ['china', 'cn'],
  ['christmasisland', 'cx'],
  ['cocos(keeling)islands', 'cc'],
  ['colombia', 'co'],
  ['comoros', 'km'],
  ['congo', 'cg'],
  ['congo,democraticrepublic', 'cd'],
  ['cookislands', 'ck'],
  ['costarica', 'cr'],
  ["coted'ivoire", 'ci'],
  ['croatia', 'hr'],
  ['cuba', 'cu'],
  ['cyprus', 'cy'],
  ['czechrepublic', 'cz'],
  ['denmark', 'dk'],
  ['djibouti', 'dj'],
  ['dominica', 'dm'],
  ['dominicanrepublic', 'do'],
  ['ecuador', 'ec'],
  ['egypt', 'eg'],
  ['elsalvador', 'sv'],
  ['equatorialguinea', 'gq'],
  ['eritrea', 'er'],
  ['estonia', 'ee'],
  ['ethiopia', 'et'],
  ['falklandislands(malvinas)', 'fk'],
  ['faroeislands', 'fo'],
  ['fiji', 'fj'],
  ['finland', 'fi'],
  ['france', 'fr'],
  ['frenchguiana', 'gf'],
  ['frenchpolynesia', 'pf'],
  ['frenchsouthernterritories', 'tf'],
  ['gabon', 'ga'],
  ['gambia', 'gm'],
  ['georgia', 'ge'],
  ['germany', 'de'],
  ['ghana', 'gh'],
  ['gibraltar', 'gi'],
  ['greece', 'gr'],
  ['greenland', 'gl'],
  ['grenada', 'gd'],
  ['guadeloupe', 'gp'],
  ['guam', 'gu'],
  ['guatemala', 'gt'],
  ['guernsey', 'gg'],
  ['guinea', 'gn'],
  ['guinea-bissau', 'gw'],
  ['guyana', 'gy'],
  ['haiti', 'ht'],
  ['heardisland&mcdonaldislands', 'hm'],
  ['holysee(vaticancitystate)', 'va'],
  ['honduras', 'hn'],
  ['hongkong', 'hk'],
  ['hungary', 'hu'],
  ['iceland', 'is'],
  ['india', 'in'],
  ['indonesia', 'id'],
  ['iran,islamicrepublicof', 'ir'],
  ['iraq', 'iq'],
  ['ireland', 'ie'],
  ['isleofman', 'im'],
  ['israel', 'il'],
  ['italy', 'it'],
  ['jamaica', 'jm'],
  ['japan', 'jp'],
  ['jersey', 'je'],
  ['jordan', 'jo'],
  ['kazakhstan', 'kz'],
  ['kenya', 'ke'],
  ['kiribati', 'ki'],
  ['korea', 'kr'],
  ['kuwait', 'kw'],
  ['kyrgyzstan', 'kg'],
  ["laopeople'sdemocraticrepublic", 'la'],
  ['latvia', 'lv'],
  ['lebanon', 'lb'],
  ['lesotho', 'ls'],
  ['liberia', 'lr'],
  ['libyanarabjamahiriya', 'ly'],
  ['liechtenstein', 'li'],
  ['lithuania', 'lt'],
  ['luxembourg', 'lu'],
  ['macao', 'mo'],
  ['macedonia', 'mk'],
  ['madagascar', 'mg'],
  ['malawi', 'mw'],
  ['malaysia', 'my'],
  ['maldives', 'mv'],
  ['mali', 'ml'],
  ['malta', 'mt'],
  ['marshallislands', 'mh'],
  ['martinique', 'mq'],
  ['mauritania', 'mr'],
  ['mauritius', 'mu'],
  ['mayotte', 'yt'],
  ['mexico', 'mx'],
  ['micronesia,federatedstatesof', 'fm'],
  ['moldova', 'md'],
  ['monaco', 'mc'],
  ['mongolia', 'mn'],
  ['montenegro', 'me'],
  ['montserrat', 'ms'],
  ['morocco', 'ma'],
  ['mozambique', 'mz'],
  ['myanmar', 'mm'],
  ['namibia', 'na'],
  ['nauru', 'nr'],
  ['nepal', 'np'],
  ['netherlands', 'nl'],
  ['netherlandsantilles', 'an'],
  ['newcaledonia', 'nc'],
  ['newzealand', 'nz'],
  ['nicaragua', 'ni'],
  ['niger', 'ne'],
  ['nigeria', 'ng'],
  ['niue', 'nu'],
  ['norfolkisland', 'nf'],
  ['northernmarianaislands', 'mp'],
  ['norway', 'no'],
  ['oman', 'om'],
  ['pakistan', 'pk'],
  ['palau', 'pw'],
  ['palestinianterritory,occupied', 'ps'],
  ['panama', 'pa'],
  ['papuanewguinea', 'pg'],
  ['paraguay', 'py'],
  ['peru', 'pe'],
  ['philippines', 'ph'],
  ['pitcairn', 'pn'],
  ['poland', 'pl'],
  ['portugal', 'pt'],
  ['puertorico', 'pr'],
  ['qatar', 'qa'],
  ['reunion', 're'],
  ['romania', 'ro'],
  ['russianfederation', 'ru'],
  ['rwanda', 'rw'],
  ['saintbarthelemy', 'bl'],
  ['sainthelena', 'sh'],
  ['saintkittsandnevis', 'kn'],
  ['saintlucia', 'lc'],
  ['saintmartin', 'mf'],
  ['saintpierreandmiquelon', 'pm'],
  ['saintvincentandgrenadines', 'vc'],
  ['samoa', 'ws'],
  ['sanmarino', 'sm'],
  ['saotomeandprincipe', 'st'],
  ['saudiarabia', 'sa'],
  ['senegal', 'sn'],
  ['serbia', 'rs'],
  ['seychelles', 'sc'],
  ['sierraleone', 'sl'],
  ['singapore', 'sg'],
  ['slovakia', 'sk'],
  ['slovenia', 'si'],
  ['solomonislands', 'sb'],
  ['somalia', 'so'],
  ['southafrica', 'za'],
  ['southgeorgiaandsandwichisl.', 'gs'],
  ['spain', 'es'],
  ['srilanka', 'lk'],
  ['sudan', 'sd'],
  ['suriname', 'sr'],
  ['svalbardandjanmayen', 'sj'],
  ['swaziland', 'sz'],
  ['sweden', 'se'],
  ['switzerland', 'ch'],
  ['syrianarabrepublic', 'sy'],
  ['taiwan', 'tw'],
  ['tajikistan', 'tj'],
  ['tanzania', 'tz'],
  ['thailand', 'th'],
  ['timor-leste', 'tl'],
  ['togo', 'tg'],
  ['tokelau', 'tk'],
  ['tonga', 'to'],
  ['trinidadandtobago', 'tt'],
  ['tunisia', 'tn'],
  ['turkey', 'tr'],
  ['turkmenistan', 'tm'],
  ['turksandcaicosislands', 'tc'],
  ['tuvalu', 'tv'],
  ['uganda', 'ug'],
  ['ukraine', 'ua'],
  ['unitedarabemirates', 'ae'],
  ['unitedkingdom', 'gb'],
  ['unitedstates', 'us'],
  ['unitedstatesoutlyingislands', 'um'],
  ['uruguay', 'uy'],
  ['uzbekistan', 'uz'],
  ['vanuatu', 'vu'],
  ['venezuela', 've'],
  ['vietnam', 'vn'],
  ['virginislands,british', 'vg'],
  ['virginislands,u.s.', 'vi'],
  ['wallisandfutuna', 'wf'],
  ['westernsahara', 'eh'],
  ['yemen', 'ye'],
  ['zambia', 'zm'],
  ['zimbabwe', 'zw']
])
